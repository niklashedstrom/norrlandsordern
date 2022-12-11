const db = require('./database');
const helper = require('./helpers');

const sublist = (toplist, self) => {
  const first_index = Math.max(0, self.index - 3);
  const last_index = Math.min(first_index + 5, toplist.length);
  return toplist.slice(first_index, last_index)
}

const volumeToplist = (norrlands) => {
  const grouped = {
    '33': 0,
    '40': 0,
    '50': 0,
  }
  norrlands.forEach(n => {
    grouped[n.volume] += 1;
  });
  return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
}

const firstNorrland = (norrlands, userId) => {
  const first = norrlands.findIndex(n => n.user_id == userId);
  let season;
  switch(norrlands[first]?.created_at.getMonth()) {
    case 0: case 1: season = 'vintern'; break;
    case 2: case 3: case 4: season = 'våren'; break;
    case 5: case 6: case 7: season = 'sommaren'; break;
    case 8: case 9: case 10: season = 'hösten'; break;
  }
  return {norrland: norrlands[first], index: first + 1, season: season};
}

const groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] + x.volume || x.volume);
    return rv;
  }, {});
};

const topDay = (norrlands) => {
  const grouped = groupBy(norrlands.map(n => ({...n, created_at: n.created_at.toISOString().slice(0,10)})), 'created_at');
  return Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
}

const hourToplist = (norrlands) => {
  const hours = {};
  [...new Array(24).keys()].forEach(h => hours[h] = 0);
  norrlands.forEach(n => {
    hours[n.created_at.getHours()] += n.volume;
  });
  return Object.entries(hours).sort((a, b) => a[0] - b[0]);
}

const topTimeOfDay = (hours) => {
  const names = [
    ['på natten', hours.slice(0, 6).reduce((a, b) => a + b[1], 0)],
    ['på morgonen', hours.slice(6, 10).reduce((a, b) => a + b[1], 0)],
    ['under dagen', hours.slice(10, 14).reduce((a, b) => a + b[1], 0)],
    ['under eftermiddagen', hours.slice(14, 18).reduce((a, b) => a + b[1], 0)],
    ['på kvällen', hours.slice(18, 23).reduce((a, b) => a + b[1], 0)],
  ]

  return names.sort((a, b) => b[1] - a[1])[0];
}

const weekdayToplist = (norrlands) => {
  const weekdays = {};
  [...new Array(7).keys()].forEach(d => weekdays[d] = 0);
  norrlands.forEach(n => {
    weekdays[n.created_at.getDay()] += n.volume;
  });
  const list = Object.entries(weekdays).sort((a, b) => a[0] - b[0]);
  return [
    ['måndagar', list[1][1]],
    ['tisdagar', list[2][1]],
    ['onsdagar', list[3][1]],
    ['torsdagar', list[4][1]],
    ['fredagar', list[5][1]],
    ['lördagar', list[6][1]],
    ['söndagar', list[0][1]],
  ]
}

const topDayOfWeek = (weekdays) => {
  return weekdays.sort((a, b) => b[1] - a[1])[0];
}

const normalize = (l) => {
  const max = Math.max(...l.map(n => n[1]));
  return l.map(n => [n[0], n[1] / max]);
}

exports.w2021 = async (req, res) => {
  const userId = req.user?._id;
  Promise.all([db.getUserCount(), db.getToplistRange(500, userId, 'wrapped2021'), db.getAllNorrlands(new Date("2021-01-01"), new Date("2022-01-01"))]).then(values => {
    const [ nbrOfUsers, toplist, norrlands ] = values;
    const self = toplist.find(r => r.self);
    const norrlands2021 = norrlands.filter(n => n.created_at.toISOString().startsWith('2021')).reverse();
    const norrlandsSelf = norrlands.filter(n => n.user_id == userId).reverse();
    const norrlands2021Self = norrlands2021.filter(n => n.user_id === userId);
    const topHours = hourToplist(norrlands2021Self);
    const topWeekdays = weekdayToplist(norrlands2021Self);
    const topVolumes = volumeToplist(norrlands2021Self);
    res.render('wrapped/2021', {
      cl: parseInt(self.volume_sum),
      topPercentage: 100 - self.index / nbrOfUsers * 100,
      sublistToplist: sublist(toplist, self),
      topVolumes: topVolumes,
      firstNorrland: firstNorrland(norrlands2021, userId),
      becameMember2021: norrlandsSelf[0].created_at.toISOString().startsWith('2021'),
      norrlandsBefore2021: norrlandsSelf.filter(n => n.created_at.toISOString().startsWith('2020')).length,
      topDay: topDay(norrlands2021Self),
      topHours: normalize(topHours),
      topHoursAll: normalize(hourToplist(norrlands2021)),
      topTimeOfDay: topTimeOfDay(topHours),
      topWeekdays: normalize(topWeekdays),
      topWeekdaysAll: normalize(weekdayToplist(norrlands2021)),
      topDayOfWeek: topDayOfWeek(topWeekdays),
      formatNumber: helper.formatNumber,
      formatDate: helper.formatDate,
    })
  }).then(_ => db.userHasVistitedWrapped2021(userId))
};