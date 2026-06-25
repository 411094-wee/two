const defaultLunches = [
  '鹽酥雞便當',
  '滷肉飯',
  '炸醬麵',
  '牛肉麵',
  '烤雞沙拉',
  '日式豬排飯',
  '韓式石鍋拌飯',
  '義大利麵',
  '雞腿便當',
  '關東煮',
  '牛丼',
  '生魚片飯',
  '壽司組合',
  '三明治',
  '咖哩飯',
  '牛奶鍋',
  '燒臘飯',
  '炒飯',
  '蔥抓餅',
  '番茄義大利麵'
];

const wheel = document.getElementById('wheel');
const spinButton = document.getElementById('spinButton');
const selectedLunch = document.getElementById('selectedLunch');
const lunchList = document.getElementById('lunchList');
const lunchCount = document.getElementById('lunchCount');
const addButton = document.getElementById('addButton');
const newLunchInput = document.getElementById('newLunch');
const messageBox = document.getElementById('messageBox');

let lunches = [...defaultLunches];
let isSpinning = false;
let currentRotation = 0;

function getSegmentAngle() {
  return 360 / lunches.length;
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeSector(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function renderWheel() {
  wheel.innerHTML = '';
  const segmentAngle = getSegmentAngle();
  const radius = 90;
  const center = 100;

  lunches.forEach((item, index) => {
    const startAngle = index * segmentAngle;
    const endAngle = startAngle + segmentAngle;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', describeSector(center, center, radius, startAngle, endAngle));
    path.setAttribute('fill', index % 2 === 0 ? 'rgba(37, 99, 235, 0.18)' : 'rgba(59, 130, 246, 0.16)');
    wheel.appendChild(path);

    const midAngle = startAngle + segmentAngle / 2;
    const labelRadius = radius * 0.63;
    const labelPos = polarToCartesian(center, center, labelRadius, midAngle);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', labelPos.x.toString());
    text.setAttribute('y', labelPos.y.toString());
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '6');
    text.setAttribute('transform', `rotate(${midAngle}, ${labelPos.x}, ${labelPos.y})`);
    text.textContent = item;
    wheel.appendChild(text);
  });

  const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  innerCircle.setAttribute('cx', center.toString());
  innerCircle.setAttribute('cy', center.toString());
  innerCircle.setAttribute('r', '16');
  innerCircle.setAttribute('fill', 'white');
  innerCircle.setAttribute('stroke', 'rgba(37, 99, 235, 0.3)');
  innerCircle.setAttribute('stroke-width', '3');
  wheel.appendChild(innerCircle);
}

function renderList() {
  lunchList.innerHTML = '';
  lunches.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    lunchList.appendChild(li);
  });
  lunchCount.textContent = lunches.length;
}

function getRotationForIndex(index) {
  const segmentAngle = getSegmentAngle();
  const baseAngle = 360 - index * segmentAngle - segmentAngle / 2;
  const spins = 5;
  return currentRotation + spins * 360 + baseAngle;
}

function getRandomIndex() {
  return Math.floor(Math.random() * lunches.length);
}

function showMessage(text, type = 'success') {
  messageBox.textContent = text;
  messageBox.style.color = type === 'success' ? 'var(--success)' : 'var(--warning)';
}

spinButton.addEventListener('click', () => {
  if (isSpinning || lunches.length === 0) {
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;
  const chosenIndex = getRandomIndex();
  const targetRotation = getRotationForIndex(chosenIndex);

  wheel.style.transition = 'transform 4s cubic-bezier(0.22, 1, 0.36, 1)';
  wheel.style.transform = `rotate(${targetRotation}deg)`;

  const selectedItem = lunches[chosenIndex];
  selectedLunch.textContent = '轉盤正在轉動...';
  messageBox.textContent = '';

  wheel.addEventListener('transitionend', function handleTransition() {
    wheel.removeEventListener('transitionend', handleTransition);
    currentRotation = targetRotation % 360;
    selectedLunch.textContent = selectedItem;
    isSpinning = false;
    spinButton.disabled = false;
    showMessage(`午餐選好了：${selectedItem}`);
  });
});

addButton.addEventListener('click', () => {
  const value = newLunchInput.value.trim();
  if (!value) {
    showMessage('請輸入午餐名稱。', 'warning');
    return;
  }

  lunches.push(value);
  newLunchInput.value = '';
  renderWheel();
  renderList();
  showMessage(`已加入：${value}`);
});

newLunchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addButton.click();
  }
});

renderWheel();
renderList();
