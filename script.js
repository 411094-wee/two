const defaultLunches = [
  { name: '鹽酥雞便當', english: 'Salted Crispy Chicken Bento' },
  { name: '滷肉飯', english: 'Braised Pork Rice' },
  { name: '炸醬麵', english: 'Zhajiang Noodles' },
  { name: '牛肉麵', english: 'Beef Noodle Soup' },
  { name: '烤雞沙拉', english: 'Grilled Chicken Salad' },
  { name: '日式豬排飯', english: 'Japanese Pork Cutlet Rice' },
  { name: '韓式石鍋拌飯', english: 'Korean Bibimbap' },
  { name: '義大利麵', english: 'Pasta' },
  { name: '雞腿便當', english: 'Chicken Leg Bento' },
  { name: '關東煮', english: 'Oden' },
  { name: '牛丼', english: 'Gyudon' },
  { name: '生魚片飯', english: 'Sashimi Rice Bowl' },
  { name: '壽司組合', english: 'Sushi Set' },
  { name: '三明治', english: 'Sandwich' },
  { name: '咖哩飯', english: 'Curry Rice' },
  { name: '牛奶鍋', english: 'Milk Hot Pot' },
  { name: '燒臘飯', english: 'Roast Meat Rice' },
  { name: '炒飯', english: 'Fried Rice' },
  { name: '蔥抓餅', english: 'Scallion Pancake' },
  { name: '番茄義大利麵', english: 'Tomato Pasta' }
];

const wheel = document.getElementById('wheel');
const spinButton = document.getElementById('spinButton');
const selectedLunch = document.getElementById('selectedLunch');
const lunchList = document.getElementById('lunchList');
const lunchCount = document.getElementById('lunchCount');
const addButton = document.getElementById('addButton');
const newLunchInput = document.getElementById('newLunch');
const newLunchEnglishInput = document.getElementById('newLunchEnglish');
const messageBox = document.getElementById('messageBox');
const syncStatus = document.getElementById('syncStatus');

const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbydnfp6WYmsdBKyKwrDEd-Glm6kPLby6oDxOndbfQKiYxzYN8se9PQA-4tfbLnYZC9bMA/exec';

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
    text.setAttribute('font-size', '8');
    text.setAttribute('fill', '#0f172a');
    text.setAttribute('transform', `rotate(${midAngle}, ${labelPos.x}, ${labelPos.y})`);
    text.textContent = (index + 1).toString();
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
    li.textContent = `${item.name} - ${item.english}`;
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

async function translateChineseToEnglish(text) {
  const fallback = {
    '鹽酥雞便當': 'Salted Crispy Chicken Bento',
    '滷肉飯': 'Braised Pork Rice',
    '炸醬麵': 'Zhajiang Noodles',
    '牛肉麵': 'Beef Noodle Soup',
    '烤雞沙拉': 'Grilled Chicken Salad',
    '日式豬排飯': 'Japanese Pork Cutlet Rice',
    '韓式石鍋拌飯': 'Korean Bibimbap',
    '義大利麵': 'Pasta',
    '雞腿便當': 'Chicken Leg Bento',
    '關東煮': 'Oden',
    '牛丼': 'Gyudon',
    '生魚片飯': 'Sashimi Rice Bowl',
    '壽司組合': 'Sushi Set',
    '三明治': 'Sandwich',
    '咖哩飯': 'Curry Rice',
    '牛奶鍋': 'Milk Hot Pot',
    '燒臘飯': 'Roast Meat Rice',
    '炒飯': 'Fried Rice',
    '蔥抓餅': 'Scallion Pancake',
    '番茄義大利麵': 'Tomato Pasta'
  };

  if (fallback[text]) {
    return fallback[text];
  }

  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh|en`);
    const json = await response.json();
    if (json && json.responseData && json.responseData.translatedText) {
      return json.responseData.translatedText;
    }
  } catch (error) {
    console.warn('Translation API failed:', error);
  }

  return text;
}

async function postToSheet(payload) {
  if (!GOOGLE_SHEETS_WEBAPP_URL) {
    setSyncStatus('尚未設定 Google 試算表 Web App URL。', 'warning');
    return null;
  }

  const response = await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${bodyText}`);
  }

  return response.json();
}

function setSyncStatus(text, type = 'info') {
  if (!syncStatus) return;
  syncStatus.textContent = text;
  syncStatus.style.color = type === 'warning' ? 'var(--warning)' : '#334155';
}

async function fetchSheetLunches() {
  if (!GOOGLE_SHEETS_WEBAPP_URL) return [];
  setSyncStatus('正在從 Google 試算表讀取午餐資料...');

  try {
    const result = await postToSheet({ action: 'fetch' });
    if (result && result.success && Array.isArray(result.rows)) {
      return result.rows;
    }
    setSyncStatus('無法讀取 Google 試算表資料，請檢查 Web App。', 'warning');
  } catch (error) {
    console.error('Sheet fetch failed', error);
    setSyncStatus(`無法連線到 Google 試算表：${error.message}`.slice(0, 160), 'warning');
  }
  return [];
}

function normalizeSheetRows(rows) {
  return rows
    .map((row) => {
      if (!Array.isArray(row)) return null;
      const name = String(row[0] || '').trim();
      const english = String(row[1] || '').trim();
      if (!name) return null;
      if (name.toLowerCase().includes('name') && english.toLowerCase().includes('english')) return null;
      return { name, english: english || name };
    })
    .filter(Boolean);
}

function mergeLunches(sheetItems) {
  const merged = new Map();
  lunches.forEach((item) => {
    merged.set(item.name, item);
  });
  sheetItems.forEach((item) => {
    if (!merged.has(item.name)) {
      merged.set(item.name, item);
    }
  });
  return Array.from(merged.values());
}

async function syncSheetData() {
  if (!GOOGLE_SHEETS_WEBAPP_URL) return;
  const sheetRows = await fetchSheetLunches();
  const sheetItems = normalizeSheetRows(sheetRows);
  const combined = mergeLunches(sheetItems);

  const needUpdateLocal = combined.length !== lunches.length || combined.some((item, index) => lunches[index]?.name !== item.name || lunches[index]?.english !== item.english);
  if (needUpdateLocal) {
    lunches = combined;
    renderWheel();
    renderList();
    setSyncStatus('已從 Google 試算表同步新午餐到本機。');
  }

  const rows = lunches.map((item) => [item.name, item.english]);
  try {
    const result = await postToSheet({ action: 'replace', rows });
    if (result && result.success) {
      setSyncStatus('已同步本機與 Google 試算表資料。');
    } else {
      setSyncStatus('Google 試算表同步失敗，請檢查 Web App 設定。', 'warning');
    }
  } catch (error) {
    console.error('Sheet sync failed', error);
    setSyncStatus(`無法連線到 Google 試算表：${error.message}`.slice(0, 160), 'warning');
  }
}

async function appendLunchToSheet(item) {
  if (!GOOGLE_SHEETS_WEBAPP_URL) return;
  setSyncStatus('正在將新午餐儲存到 Google 試算表...');

  try {
    const result = await postToSheet({ action: 'append', rows: [[item.name, item.english]] });
    if (result && result.success) {
      setSyncStatus('已將新午餐儲存到 Google 試算表。');
    } else {
      setSyncStatus('新增午餐同步失敗，請檢查 Web App 設定。', 'warning');
    }
  } catch (error) {
    console.error('Sheet append failed', error);
    setSyncStatus(`無法連線到 Google 試算表：${error.message}`.slice(0, 160), 'warning');
  }
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

  const speed = Math.floor(Math.random() * (200 - 30 + 1)) + 30; // degrees per second
  const totalDegrees = targetRotation - currentRotation;
  const duration = Math.max(1, totalDegrees / speed);

  wheel.style.transition = `transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1)`;
  wheel.style.transform = `rotate(${targetRotation}deg)`;

  const selectedItem = lunches[chosenIndex];
  const selectedNumber = chosenIndex + 1;
  selectedLunch.textContent = '轉盤正在轉動...';
  messageBox.textContent = '';

  wheel.addEventListener('transitionend', function handleTransition() {
    wheel.removeEventListener('transitionend', handleTransition);
    currentRotation = targetRotation % 360;
    selectedLunch.textContent = `第 ${selectedNumber} 號：${selectedItem.name} / ${selectedItem.english}`;
    isSpinning = false;
    spinButton.disabled = false;
    showMessage(`午餐選好了：第 ${selectedNumber} 號 - ${selectedItem.name} / ${selectedItem.english}`);
  });
});

addButton.addEventListener('click', async () => {
  const value = newLunchInput.value.trim();
  const englishValue = newLunchEnglishInput.value.trim();
  if (!value) {
    showMessage('請輸入午餐名稱。', 'warning');
    return;
  }

  addButton.disabled = true;
  showMessage('正在取得英文翻譯...', 'success');

  const english = englishValue || await translateChineseToEnglish(value);
  const newItem = { name: value, english };

  lunches.push(newItem);
  newLunchInput.value = '';
  newLunchEnglishInput.value = '';
  renderWheel();
  renderList();
  showMessage(`已加入：${newItem.name} / ${newItem.english}`);
  await appendLunchToSheet(newItem);
  addButton.disabled = false;
});

newLunchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addButton.click();
  }
});

renderWheel();
renderList();
syncSheetData();
