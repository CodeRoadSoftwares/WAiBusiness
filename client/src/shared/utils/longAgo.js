function longAgo(dateInput) {
  const now = new Date();
  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    return "";
  }

  const diffMs = now - date;
  const msPerDay = 1000 * 60 * 60 * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  if (diffMs >= msPerYear) {
    const years = Math.floor(diffMs / msPerYear);
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  } else if (diffMs >= msPerMonth) {
    const months = Math.floor(diffMs / msPerMonth);
    return `${months} month${months !== 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffMs / msPerDay);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }
}

export default longAgo;
