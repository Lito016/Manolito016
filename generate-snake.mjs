// Generate snake animation SVG from GitHub contribution data
const username = 'Manolito016';

async function fetchContributions() {
  // Fetch contribution data from GitHub's graphql-free endpoint
  const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
  const data = await res.json();
  return data;
}

function generateSnakeSVG(contributions, isDark = false) {
  const weeks = 53;
  const days = 7;
  const cellSize = 12;
  const cellGap = 2;
  const totalSize = cellSize + cellGap;
  const width = weeks * totalSize + 20;
  const height = days * totalSize + 40;

  const bg = isDark ? '#0D1117' : '#ffffff';
  const emptyColor = isDark ? '#161B22' : '#ebedf0';
  const colors = isDark
    ? ['#161B22', '#0e4429', '#006d32', '#26a641', '#39d353']
    : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
  const snakeColor = isDark ? '#58a6ff' : '#3B82F6';
  const textColor = isDark ? '#c9d1d9' : '#24292f';

  // Build contribution grid
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7));

  let svgCells = '';
  const grid = [];

  for (let w = 0; w < weeks; w++) {
    grid[w] = [];
    for (let d = 0; d < days; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      const dateStr = date.toISOString().split('T')[0];

      const contrib = contributions?.contributions?.find(c => c.date === dateStr);
      const count = contrib?.count || 0;
      const level = count === 0 ? 0 : count <= 3 ? 1 : count <= 6 ? 2 : count <= 9 ? 3 : 4;

      grid[w][d] = { count, level, date: dateStr };

      const x = w * totalSize + 20;
      const y = d * totalSize + 20;

      svgCells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" ry="2" fill="${colors[level]}" data-date="${dateStr}" data-count="${count}"/>`;
    }
  }

  // Generate snake path through the grid
  const snakePath = generateSnakePath(weeks, days);
  let snakeElements = '';
  const snakeFrames = 30;

  for (let frame = 0; frame < snakeFrames; frame++) {
    const opacity = 0.8;
    const pathPoints = snakePath.slice(frame % snakePath.length, (frame % snakePath.length) + 8);

    pathPoints.forEach((point, i) => {
      const x = point.x * totalSize + 20;
      const y = point.y * totalSize + 20;
      const size = cellSize - (i * 0.5);
      const op = opacity - (i * 0.08);

      snakeElements += `<rect x="${x}" y="${y}" width="${Math.max(size, 4)}" height="${Math.max(size, 4)}" rx="2" ry="2" fill="${snakeColor}" opacity="${Math.max(op, 0.1)}">
        <animate attributeName="opacity" values="${Math.max(op, 0.1)};${Math.max(op * 0.5, 0.05)};${Math.max(op, 0.1)}" dur="2s" repeatCount="indefinite"/>
      </rect>`;
    });
  }

  // Month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let monthLabels = '';
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + w * 7);
    if (date.getMonth() !== lastMonth) {
      lastMonth = date.getMonth();
      monthLabels += `<text x="${w * totalSize + 20}" y="14" fill="${textColor}" font-size="10" font-family="sans-serif">${months[date.getMonth()]}</text>`;
    }
  }

  // Day labels
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  let dayLabelsSvg = '';
  dayLabels.forEach((label, i) => {
    if (label) {
      dayLabelsSvg += `<text x="0" y="${i * totalSize + 28}" fill="${textColor}" font-size="10" font-family="sans-serif">${label}</text>`;
    }
  });

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  ${monthLabels}
  ${dayLabelsSvg}
  ${svgCells}
  ${snakeElements}
</svg>`;
}

function generateSnakePath(weeks, days) {
  const path = [];
  let x = 0, y = 0;
  let dx = 1, dy = 0;

  for (let step = 0; step < weeks * days * 2; step++) {
    path.push({ x: x % weeks, y: y % days });

    // Move in snake pattern
    if (dx === 1) {
      x++;
      if (x >= weeks) { x = weeks - 1; y++; dx = 0; dy = 1; }
    } else if (dy === 1) {
      y++;
      if (y >= days) { y = days - 1; x--; dx = -1; dy = 0; }
    } else if (dx === -1) {
      x--;
      if (x < 0) { x = 0; y++; dx = 0; dy = 1; }
    } else if (dy === 1) {
      y++;
      if (y >= days) { y = days - 1; dx = 1; dy = 0; }
    }
  }

  return path;
}

async function main() {
  console.log('Fetching contribution data for', username, '...');
  const data = await fetchContributions();

  console.log('Generating light mode SVG...');
  const lightSVG = generateSnakeSVG(data, false);

  console.log('Generating dark mode SVG...');
  const darkSVG = generateSnakeSVG(data, true);

  const fs = await import('fs');
  fs.writeFileSync('snake-light.svg', lightSVG);
  fs.writeFileSync('snake-dark.svg', darkSVG);

  console.log('Done! Generated snake-light.svg and snake-dark.svg');
}

main().catch(console.error);
