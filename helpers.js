
exports.getPercentage = (dist) => {
  const totalDist = 540811.52;
  return dist/totalDist;
}

exports.getPosition = (dist) => {
  const compensation = 1.008; // To handle offset due to lonitude not being linear. Should be changed continuously.
  const startPos = [55.710783, 13.210120];
  const endPos = [60.201391, 16.739080];
  const percentage = exports.getPercentage(dist);
  const lat = startPos[0] + percentage*(endPos[0]-startPos[0]);
  const lon = startPos[1] + percentage**compensation*(endPos[1]-startPos[1]);
  return {lat, lon};
}

exports.backUrl = (url) => url.split('/').slice(0,-1).join('/')

exports.formatNumber = (number, decimals) => {
  if (decimals == 0)
    return (number).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ').slice(0,-3)
  else
    return (number).toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$& ')
}

exports.formatDate = (date) => {
  date = new Date(date.toLocaleString('en-US', {timeZone: 'Europe/Stockholm'}))
  const pad = (number) => ('000' + number).slice(-2)
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

exports.formatDateDiff = (from, to) => {
  const diff = to - from;
  const minutes = parseInt(diff/1000/60)
  const hours = parseInt(minutes/60)
  const days = parseInt(hours/24)

  if (days != 0) return (days == 1) ? '1 dag' : days + ' dagar';
  if (hours != 0) return (hours == 1) ? '1 timme' : hours + ' timmar';
  return (minutes == 1) ? '1 minut': minutes + ' minuter';
}
