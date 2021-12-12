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

const topDay = (norrlands) => {
  var groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] + x.volume || x.volume);
      return rv;
    }, {});
  };
  const grouped = groupBy(norrlands.map(n => ({...n, created_at: n.created_at.toISOString().slice(0,10)})), 'created_at');
  return Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
}

exports.w2021 = async (req, res) => {
  const userId = req.user?.id;
  Promise.all([db.getUserCount(), db.getToplistRange(500, userId, 'wrapped2021'), db.getAllNorrlands()]).then(values => {
    const [ nbrOfUsers, toplist, norrlands ] = values;
    const self = toplist.find(r => r.self);
    const norrlands2021 = norrlands.filter(n => n.created_at.toISOString().startsWith('2021')).reverse();
    const norrlandsSelf = norrlands.filter(n => n.user_id == userId).reverse();
    const norrlands2021Self = norrlands2021.filter(n => n.user_id === userId);
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
      formatNumber: helper.formatNumber,
      formatDate: helper.formatDate,
    })
  })
};