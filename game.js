// 💡 Firebase 설정 (Firebase 콘솔에서 받은 설정값으로 반드시 교체하세요!)
const firebaseConfig = {
  apiKey: "AIzaSyB1IbTUYQDXJEqIO-WLEeLG0UR_mlEH3FM",
  authDomain: "dungeon-survivor-e8b84.firebaseapp.com",
  projectId: "dungeon-survivor-e8b84",
  storageBucket: "dungeon-survivor-e8b84.firebasestorage.app",
  messagingSenderId: "977201266583",
  appId: "1:977201266583:web:36f2d98346262406f6ced2",
  measurementId: "G-Z7ESQ65SY7"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;

// 💡 1 & 2. 스킬 랭크(rank) 변경 및 마나 소비량 상향
const jobData = {
    '바바리안': { img: 'image/barbarian.png', desc: '강력한 체력과 공격력으로 적을 분쇄하는 전사', atk:25, matk:10, str:20, dex:5, luk:10, int:10, maxHp:180, maxMp:50, def:15, skills: [{n:'분쇄', rank:1, mp:15, mult:1.5}, {n:'대지 강타', rank:2, mp:30, mult:2.2}, {n:'광전사의 분노', rank:3, mp:50, mult:3.0}] },
    '엘프': { img: 'image/elf.png', desc: '빠른 몸놀림과 날카로운 활시위로 적을 제압하는 궁수', atk:20, matk:10, str:15, dex:25, luk:10, int:10, maxHp:110, maxMp:60, def:5, skills: [{n:'연사', rank:1, mp:15, mult:1.5}, {n:'관통 화살', rank:2, mp:30, mult:2.2}, {n:'폭풍의 시위', rank:3, mp:50, mult:3.0}] },
    '드워프': { img: 'image/dwarf.png', desc: '강철 같은 방어력으로 최전방을 지키는 철벽의 수호자', atk:22, matk:10, str:15, dex:10, luk:10, int:10, maxHp:220, maxMp:50, def:20, skills: [{n:'방패 치기', rank:1, mp:15, mult:1.5}, {n:'지진', rank:2, mp:30, mult:2.2}, {n:'철벽의 일격', rank:3, mp:50, mult:3.0}] },
    '마법사': { img: 'image/magician.png', desc: '강력한 마력으로 적을 불태우는 지식인', atk:10, matk:25, str:10, dex:10, luk:15, int:20, maxHp:80, maxMp:150, def:5, skills: [{n:'매직 애로우', rank:1, mp:20, mult:1.6}, {n:'파이어볼', rank:2, mp:40, mult:2.4}, {n:'메테오', rank:3, mp:70, mult:3.5}] },
    '도적': { img: 'image/assassin.png', desc: '행운을 이용해 치명적인 한 방을 노리는 암살자', atk:22, matk:10, str:10, dex:20, luk:25, int:10, maxHp:90, maxMp:50, def:5, skills: [{n:'기습', rank:1, mp:15, mult:1.5}, {n:'그림자 베기', rank:2, mp:30, mult:2.2}, {n:'암살', rank:3, mp:50, mult:3.0}] },
    '소환사': { img: 'image/summoner.png', desc: '소환수의 힘을 빌려 전투를 지휘하는 지휘관', atk:10, matk:20, str:10, dex:15, luk:10, int:25, maxHp:100, maxMp:120, def:5, skills: [{n:'마력탄', rank:1, mp:20, mult:1.5}, {n:'정령의 분노', rank:2, mp:40, mult:2.3}, {n:'고대 마수 소환', rank:3, mp:70, mult:3.3}] }
};

let player = {
    gold: 1000, day: 1, rank: 1, level: 1, exp: 0, maxExp: 150, hunger: 100, maxHunger: 100, fatigue: 0,
    inDungeon: false, dungeonDay: 1, maxDungeonDay: 7, floor: 1, turn: 0, maxTurn: 20, dungeonKills: 0, dungeonGuideSeen: false,
    pos: {x: 1, y: 1}, visited: ['1,1'], targetPos: null,
    items: { food: 5, hpPotion: 3, mpPotion: 2, ore: 0 }, equipList: [], essenceList: [],
    equipped: { "모자": null, "상의": null, "하의": null, "신발": null, "장갑": null, "무기": null, "망토": null, "팔찌": null, "목걸이": null, "반지": [], "정수": [] },
    warehouse: { items: { food: 0, hpPotion: 0, mpPotion: 0, ore: 0 }, equipList: [], essenceList: [] },
    bossPos: null, monumentPos: null, monumentFound: false, dungeonEnteredThisMonth: false, recruitUsedThisMonth: false, orePrice: 500,
    proficiencies: { "식당": 0, "대장간": 0, "약국": 0 }, party: [] 
};

const namePool = ["철수", "영희", "지훈", "수민", "민수", "다은", "하준", "아서", "레온", "루시", "올리비아", "엘리엇", "제인", "카일", "에반", "켄지", "사쿠라", "류", "유키", "렌", "아야카", "이오리", "소라"];
const equipTypes = ["모자", "상의", "하의", "신발", "장갑", "무기", "망토", "팔찌", "반지", "목걸이"];
const statNames = { atk:'공격력', matk:'마력', str:'힘', dex:'민첩', luk:'행운', int:'지능', maxHp:'체력', maxMp:'마나', def:'방어력' };
const dropRates = [0.10, 0.05, 0.025, 0.01, 0.007, 0.005, 0.004, 0.003, 0.002, 0.001];

const floorMonsters = { 1: ["동굴 슬라임", "동굴 박쥐", "지하 고블린", "굴착기 고블린"], 2: ["스켈레톤 워리어", "유령 셰이드", "구울", "본 아처"] };
const floorBosses = { 1: "심연의 포식자, 그라둠", 2: "불사의 군신, 발키르" };
const monsterImgs = { "동굴 슬라임": "image/caveslime.png", "동굴 박쥐": "image/cavebat.png", "지하 고블린": "image/undergroundgoblin.png", "굴착기 고블린": "image/minergoblin.png", "스켈레톤 워리어": "image/skeletonwarrior.png" };
const mapGrid = [[{n:'북서'}, {n:'북'}, {n:'북동'}],[{n:'서'}, {n:'중앙'}, {n:'동'}],[{n:'남서'}, {n:'남'}, {n:'남동'}]];

const icons = {
    dungeon: `<svg viewBox="0 0 24 24"><path d="M19 19V4h-4V3H9v1H5v15H3v2h18v-2h-2zm-6 0h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>`,
    work: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
    shop: `<svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm10 16H4V8h16v12z"/></svg>`,
    bag: `<svg viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H4V8h16v12z"/></svg>`,
    guild: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    hospital: `<svg viewBox="0 0 24 24" fill="#e53935"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`,
    food: `<svg viewBox="0 0 24 24" fill="#fb8c00"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.88 3.75 3.99V22h2.5v-9.01C11.34 12.88 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`,
    hp: `<svg viewBox="0 0 24 24" fill="#e53935"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    mp: `<svg viewBox="0 0 24 24" fill="#1e88e5"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>`,
    sleep: `<svg viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>`,
    attack: `<svg viewBox="0 0 24 24" fill="#e53935"><path d="M19.73 4.27a2.5 2.5 0 0 0-3.54 0l-7.39 7.39L6.5 9.5l-2 2 3.5 3.5-4 4v3h3l4-4 3.5 3.5 2-2-2.16-2.3 7.39-7.39a2.5 2.5 0 0 0 0-3.54zM16.19 6.4L17.6 5l1.4 1.4-1.4 1.41-1.41-1.41z"/></svg>`,
    skill: `<svg viewBox="0 0 24 24" fill="#00e5ff"><path d="M3 3h18v18H3z" fill="none"/><path d="M12 2l-2.42 7.58L2 12l7.58 2.42L12 22l2.42-7.58L22 12l-7.58-2.42z"/></svg>`,
    run: `<svg viewBox="0 0 24 24" fill="#bbb"><path d="M19 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 8h-3V8l-4 4 4 4v-3h3v-2z"/></svg>`,
    equip: `<svg viewBox="0 0 24 24" fill="#ffd54f"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`,
    ore: `<svg viewBox="0 0 24 24" fill="#00e5ff"><path d="M12 2L2 12l10 10 10-10L12 2zm0 14.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"/></svg>`,
    monument: `<svg viewBox="0 0 24 24" fill="#00e5ff"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
    warehouse: `<svg viewBox="0 0 24 24" fill="#bbb"><path d="M4 6h16v2H4zm2 4h12v12H6z M11 12h2v4h-2z"/></svg>`
};

let guildRecruit = null;
let currentEnemy = null; 
let combatState = { turnIndex: 0 }; 

// 구글 로그인 및 세이브 로직
function googleLogin() {
    auth.signInWithPopup(provider).then((result) => {
        currentUser = result.user;
        fadeTransition(() => { checkFirestoreSave(currentUser.uid); });
    }).catch((error) => {
        alert("로그인에 실패했습니다: " + error.message);
    });
}

function checkFirestoreSave(uid) {
    db.collection("saves").doc(uid).get().then((doc) => {
        document.getElementById('login-screen').classList.add('hidden');
        const screen = document.getElementById('save-check-screen');
        const text = document.getElementById('save-status-text');
        const btns = document.getElementById('save-action-btns');
        screen.classList.remove('hidden');

        if (doc.exists) {
            localStorage.setItem('temp_firestore_save', JSON.stringify(doc.data()));
            text.innerHTML = "구글 계정에 연동된 클라우드 데이터가 있습니다.";
            btns.innerHTML = `
                <button class="btn" style="border-color:#4caf50; color:#4caf50; font-weight:bold; padding:16px;" onclick="continueGame()">이어하기</button>
                <button class="btn" style="border-color:#e53935; color:#e53935; padding:16px;" onclick="startNewGameConfirm()">새로하기</button>
                <p style="color:#e53935; font-size:11.5px; text-align:center; margin-top:-5px;">※ 새로 시작하면 기존 데이터는 영구 삭제됩니다.</p>
            `;
        } else {
            text.innerHTML = "저장된 데이터가 없습니다. 새로운 모험을 시작합니다.";
            btns.innerHTML = `<button class="btn" style="border-color:#4caf50; color:#4caf50; font-weight:bold; padding:16px;" onclick="startNewGame()">새로하기</button>`;
        }
    }).catch((error) => { alert("데이터를 불러오는 중 에러가 발생했습니다."); });
}

function saveGame() {
    if (currentUser) {
        db.collection("saves").doc(currentUser.uid).set(player)
        .then(() => { console.log("서버 저장 완료"); }).catch((error) => { console.error("서버 저장 실패:", error); });
    }
}

function ensureSaveCompatibility() {
    if(!player.warehouse) player.warehouse = { items: { food: 0, hpPotion: 0, mpPotion: 0, ore: 0 }, equipList: [], essenceList: [] };
    if(player.dungeonKills === undefined) player.dungeonKills = 0;
    if(player.dungeonGuideSeen === undefined) player.dungeonGuideSeen = false;
    if(player.level === 1 && player.maxExp === 100) player.maxExp = 150; 
}

function continueGame() {
    let savedData = localStorage.getItem('temp_firestore_save');
    if(savedData) {
        player = JSON.parse(savedData);
        ensureSaveCompatibility();
        fadeTransition(() => {
            document.getElementById('save-check-screen').classList.add('hidden');
            document.getElementById('game-header').classList.remove('hidden');
            document.getElementById('main-screen').classList.remove('hidden');
            if(player.inDungeon) renderDungeonUI(); else renderTownUI();
            updateDungeonTimer();
        });
    } else startNewGame();
}

function startNewGameConfirm() {
    showMessage("정말로 기존 데이터를 삭제하고 새로 시작하시겠습니까?", null, [{txt: "네 (삭제)", act: "closeModal(); startNewGame()"}, {txt: "아니오", act: "closeModal()"}]);
}

function startNewGame() {
    if(currentUser) db.collection("saves").doc(currentUser.uid).delete(); 
    localStorage.removeItem('temp_firestore_save');
    fadeTransition(() => {
        document.getElementById('save-check-screen').classList.add('hidden');
        document.getElementById('game-header').classList.remove('hidden');
        showClassSelection();
    });
}

function goToLogin() {
    fadeTransition(() => { document.getElementById('title-screen').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); });
}

function fadeTransition(callback) {
    const overlay = document.getElementById('fade-overlay');
    if (!overlay) return callback();
    overlay.style.opacity = '1'; setTimeout(() => { callback(); overlay.style.opacity = '0'; }, 300);
}

function playShakeEffect(callback) {
    const container = document.getElementById('game-container'); container.classList.add('shake');
    setTimeout(() => { container.classList.remove('shake'); setTimeout(() => { if (callback) callback(); }, 300); }, 300);
}

function showMessage(msg, callback, buttons) {
    const modal = document.getElementById('game-modal'); if (!modal) return; 
    document.getElementById('modal-text').innerHTML = msg;
    let btnArea = document.getElementById('modal-btn-area');
    if (buttons && btnArea) btnArea.innerHTML = buttons.map(b => `<button class="modal-btn" onclick="${b.act}">${b.txt}</button>`).join('');
    else if (btnArea) {
        btnArea.innerHTML = `<button class="modal-btn" id="default-modal-btn">확인</button>`;
        document.getElementById('default-modal-btn').onclick = () => { modal.classList.add('hidden'); if(callback) callback(); };
    }
    modal.classList.remove('hidden');
}

function closeModal() { const modal = document.getElementById('game-modal'); if(modal) modal.classList.add('hidden'); }

function updateAllStats() {
    if(!player.party || player.party.length === 0) return;
    
    let hudHtml = '';
    player.party.forEach((member, idx) => {
        let maxHp = member.isPlayer ? getTotalStats().maxHp : member.maxHp;
        let maxMp = member.isPlayer ? getTotalStats().maxMp : member.maxMp;
        let hpRatio = Math.max(0, Math.min(100, (member.hp / maxHp) * 100));
        let mpRatio = Math.max(0, Math.min(100, (member.mp / maxMp) * 100));
        let isDead = member.hp <= 0 ? ' (기절)' : '';
        let title = idx === 0 ? '[Leader] ' : '';
        let rankTxt = member.rank ? `${member.rank}등급 ` : '';
        
        hudHtml += `
            <div class="party-member" style="${member.hp <= 0 ? 'opacity:0.5;' : ''}">
                <div class="pm-header"><span>${title}${rankTxt}${member.name||member.job}${isDead}</span> <span>Lv.${member.level}</span></div>
                <div class="stat-row"><span class="label">HP</span><div class="bar-bg"><div class="bar hp-bar" style="width:${hpRatio}%"></div></div><span class="value-text">${member.hp}/${maxHp}</span></div>
                <div class="stat-row"><span class="label">MP</span><div class="bar-bg"><div class="bar mp-bar" style="width:${mpRatio}%"></div></div><span class="value-text">${member.mp}/${maxMp}</span></div>
        `;
        if(idx === 0) {
            let hunRatio = Math.max(0, Math.min(100, (player.hunger / 100) * 100));
            let fatRatio = Math.max(0, Math.min(100, (player.fatigue / 100) * 100));
            hudHtml += `
                <div class="stat-row"><span class="label">HUN</span><div class="bar-bg"><div class="bar hunger-bar" style="width:${hunRatio}%"></div></div><span class="value-text">${player.hunger}/100</span></div>
                <div class="stat-row"><span class="label">FAT</span><div class="bar-bg"><div class="bar fatigue-bar" style="width:${fatRatio}%"></div></div><span class="value-text">${player.fatigue}/100</span></div>
            `;
        }
        hudHtml += `</div>`;
    });
    
    const hudArea = document.getElementById('hud-area'); if(hudArea) hudArea.innerHTML = hudHtml;
    const expBar = document.getElementById('exp-bar'); if(expBar) expBar.style.width = `${(player.exp / player.maxExp) * 100}%`;
    const expText = document.getElementById('exp-text'); if(expText) expText.innerText = `Lv.${player.level} (${Math.floor(player.exp)}/${player.maxExp})`;

    saveGame();
}

// 💡 4. 렙업 시 경험치통 2.2배 (성장 지연)
function levelUp() {
    player.level++; 
    player.exp -= player.maxExp; 
    player.maxExp = Math.floor(player.maxExp * 2.2); 
    
    player.party.forEach(p => {
        p.level = player.level;
        p.atk += 1; p.matk += 1; p.def += 1;
        p.str += 1; p.dex += 1; p.luk += 1; p.int += 1; 
        p.maxHp += 10; p.maxMp += 5;
        if(p.isPlayer) { let ts = getTotalStats(); p.hp = ts.maxHp; p.mp = ts.maxMp; } 
        else { p.hp = p.maxHp; p.mp = p.maxMp; }
    });
    player.fatigue = 0; updateAllStats();
}

function passTime(days) {
    let oldMonth = Math.floor((player.day - 1) / 30) + 1;
    for(let i=0; i<days; i++) { player.day++; player.orePrice = Math.floor(500 * (0.8 + Math.random() * 0.4)); }
    let newMonth = Math.floor((player.day - 1) / 30) + 1;
    if (oldMonth !== newMonth) {
        player.dungeonEnteredThisMonth = false; player.recruitUsedThisMonth = false; guildRecruit = null;
        let tax = 1000 + Math.floor(player.gold * 0.2);
        
        if (player.gold < tax) {
            player.gold = 0;
            if(currentUser) db.collection("saves").doc(currentUser.uid).delete(); 
            fadeTransition(() => { showMessage(`[처형] 왕가의 세금 ${tax}G를 납부하지 못했습니다.<br>반역죄로 처형당했습니다...`, () => { location.reload(); }); });
            return true;
        }
        
        player.gold -= tax;
        showMessage(`새로운 달(${newMonth}월)이 밝았습니다!<br><br>왕가의 보호비 명목으로 ${tax}G (1000G + 재산의 20%)가 징수되었습니다.`, renderTownUI);
        return true;
    }
    return false;
}

function getTotalStats() {
    if(!player.party[0]) return {maxHp:1, maxMp:1}; 
    let s = { ...player.party[0] };
    for (let slot in player.equipped) {
        if (slot === "반지") player.equipped["반지"].forEach(ring => { for (let st in ring.stats) s[st] += ring.stats[st]; });
        else if (slot !== "정수" && player.equipped[slot]) { let eq = player.equipped[slot]; for (let st in eq.stats) s[st] += eq.stats[st]; }
    }
    let essenceBonus = 0; player.equipped["정수"].forEach(ess => { essenceBonus += (ess.tier * 0.01); });
    
    if (essenceBonus > 0) {
        s.atk = Math.floor(s.atk * (1 + essenceBonus)); s.matk = Math.floor(s.matk * (1 + essenceBonus));
        s.str = Math.floor(s.str * (1 + essenceBonus)); s.dex = Math.floor(s.dex * (1 + essenceBonus));
        s.luk = Math.floor(s.luk * (1 + essenceBonus)); s.int = Math.floor(s.int * (1 + essenceBonus));
        s.def = Math.floor(s.def * (1 + essenceBonus));
        s.maxHp = Math.floor(s.maxHp * (1 + essenceBonus)); s.maxMp = Math.floor(s.maxMp * (1 + essenceBonus));
    }
    return s;
}

function showClassSelection() {
    const cg = document.getElementById('class-grid');
    cg.innerHTML = Object.keys(jobData).map(k => `
        <div class="class-card" onclick="promptNickname('${k}')">
            <div class="class-sprite"><img src="${jobData[k].img}" class="class-img"></div>
            <div class="class-info"><div class="class-name">${k}</div><div class="class-desc">${jobData[k].desc}</div></div>
        </div>
    `).join('');
    fadeTransition(() => { document.getElementById('creation-screen').classList.remove('hidden'); });
}

function promptNickname(job) {
    showMessage(`[캐릭터 생성]<br>선택한 직업: <b>${job}</b><br><br>사용할 닉네임을 입력해주세요:<br><input type="text" id="nickname-input" value="모험가" style="width:100%; padding:8px; margin-top:8px; background:#222; border:1px solid #444; color:#fff; border-radius:4px;">`, null, [{txt: "결정", act: "confirmNickname('" + job + "')"}]);
}

function confirmNickname(job) {
    let input = document.getElementById('nickname-input'); let nickname = input ? input.value.trim() : "모험가";
    if(!nickname) nickname = "모험가"; closeModal(); selectClass(job, nickname);
}

function selectClass(job, nickname) {
    let d = jobData[job];
    let mainChar = { isPlayer: true, name: nickname, job: job, rank: 1, level: 1, hp: d.maxHp, mp: d.maxMp, ...d };
    player.party.push(mainChar);
    
    fadeTransition(() => {
        document.getElementById('creation-screen').classList.add('hidden'); 
        document.getElementById('main-screen').classList.remove('hidden');
        updateAllStats();
        showTutorial();
    });
}

function showTutorial() {
    showMessage(`
        <div style="font-weight:bold; color:#ffd54f; font-size:15px; margin-bottom:12px; text-align:center;">[ 던전 서바이버 세계에 오신 것을 환영합니다 ]</div>
        <b style="color:#e53935">1. 왕가의 세금 (주의!)</b><br>매월 1일, 1000G + 전 재산의 20% 납부. <b>못 내면 즉시 처형(게임오버)</b><br><br>
        <b style="color:#00e5ff">2. 마을 시설</b><br>- 길드 (동료 섭외), 일터 (골드 벌기), 병원 (기절 치료), 창고 (아이템 보관)<br><br>
        <b style="color:#ce93d8">3. 던전 규칙</b><br>던전 입장 시 자세한 가이드가 제공됩니다!
    `, renderTownUI);
}

// 💡 7. 던전 가이드 팝업
function showDungeonGuide() {
    showMessage(`
        <div style="font-weight:bold; color:#ffd54f; font-size:15px; margin-bottom:12px; text-align:center;">[ 던전 가이드 ]</div>
        ⚔️ <b>행동력 (턴)</b>: 이동하거나 탐색할 때마다 1턴이 소모됩니다. 밤(20턴)이 되면 잠을 청해야 합니다.<br><br>
        🍖 <b>허기와 피로도</b>: 허기가 0이 되면 잠을 잘 때 피로도가 폭증합니다! 피로도 관리를 위해 식량을 챙기세요.<br><br>
        💀 <b>사망 페널티</b>: 파티장이 기절하면 가진 소모품과 골드 절반을 잃고 귀환됩니다.<br><br>
        💎 <b>비석</b>: 층마다 숨겨진 비석을 찾으면 다음 층으로 갈 수 있으며, 던전 유지 기간이 5일 추가됩니다.<br><br>
        💰 <b>마을 주민 후원</b>: 던전에서 몬스터를 5마리 처치할 때마다, 귀환 시 500G의 후원금을 받습니다.
    `);
}

function showTownMenu() {
    player.inDungeon = false; updateDungeonTimer();
    let currentMonth = Math.floor((player.day - 1) / 30) + 1;
    let currentDayOfMonth = ((player.day - 1) % 30) + 1;
    
    const sceneText = document.getElementById('scene-text');
    const actionArea = document.getElementById('action-area');
    
    if(sceneText) sceneText.innerHTML = `[마을 - ${currentMonth}월 ${currentDayOfMonth}일]<br>소지금: ${player.gold}G`;
    if(actionArea) {
        actionArea.innerHTML = `
            <div class="action-grid">
                <div class="icon-btn" onclick="fadeTransition(tryEnterDungeon)">${icons.dungeon}<span>던전</span></div>
                <div class="icon-btn" onclick="fadeTransition(openWorkplace)">${icons.work}<span>일터</span></div>
                <div class="icon-btn" onclick="fadeTransition(openShop)">${icons.shop}<span>상점</span></div>
                <div class="icon-btn" onclick="fadeTransition(openGuild)">${icons.guild}<span>길드</span></div>
                <div class="icon-btn" onclick="fadeTransition(openHospital)">${icons.hospital}<span>병원</span></div>
                <div class="icon-btn" onclick="fadeTransition(openWarehouse)">${icons.warehouse}<span>창고</span></div>
            </div>
        `;
    }
}

function renderTownUI() { updateAllStats(); showTownMenu(); }

function openHospital() {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `[병원]<br>기절한 동료를 치료합니다.<br>비용: (동료의 레벨 x 200G)`;
    
    let html = `<div style="display:flex; flex-direction:column; gap:8px;">`;
    let hasDead = false;
    for(let i=1; i<player.party.length; i++) {
        let p = player.party[i];
        if (p.hp <= 0) { hasDead = true; html += `<button class="btn" style="border-color:#e53935;" onclick="healCompanion(${i}, ${p.level * 200})">${p.name} 치료 (${p.level * 200}G)</button>`; }
    }
    if(!hasDead) html += `<div style="color:#aaa; text-align:center; padding:10px;">치료가 필요한 동료가 없습니다.</div>`;
    html += `</div><button class="btn" style="margin-top:12px; width:100%;" onclick="fadeTransition(renderTownUI)">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function healCompanion(index, cost) {
    if(player.gold < cost) return showMessage(`치료비(${cost}G)가 부족합니다.`);
    player.gold -= cost; player.party[index].hp = player.party[index].maxHp;
    updateAllStats(); showMessage(`${player.party[index].name}의 치료가 완료되었습니다.`, openHospital);
}

function openGuild() {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `[용병 길드]<br>최대 6인 구성, 중복 직업 불가.`;
    actionArea.innerHTML = `<div class="action-grid" style="grid-template-columns: 1fr 1fr;"><div class="icon-btn" onclick="showRecruit()">${icons.guild}<span>동료 섭외</span></div><div class="icon-btn" onclick="showDismiss()">${icons.run}<span>동료 방출</span></div><div class="icon-btn" onclick="showMessage('승급 퀘스트는 준비 중입니다.')">${icons.attack}<span>승급 퀘스트</span></div><div class="icon-btn" style="border-color:#555;" onclick="fadeTransition(renderTownUI)">${icons.home}<span>돌아가기</span></div></div>`;
}

function showRecruit() {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    if (player.recruitUsedThisMonth) return showMessage("이번 달 길드 영입은 이미 마감되었습니다.");
    if (player.party.length >= 6) return showMessage("파티가 이미 6명으로 가득 찼습니다.");
    
    if (!guildRecruit) {
        if (Math.random() < 0.3) { player.recruitUsedThisMonth = true; return showMessage("오늘은 길드에 쓸만한 인재가 보이지 않습니다."); }
        let availableJobs = Object.keys(jobData).filter(j => !player.party.some(p => p.job === j));
        if(availableJobs.length === 0) return showMessage("더 이상 영입할 수 있는 직업이 없습니다.");
        
        let jName = availableJobs[Math.floor(Math.random() * availableJobs.length)]; let d = jobData[jName];
        guildRecruit = { isPlayer: false, name: namePool[Math.floor(Math.random() * namePool.length)], job: jName, rank: Math.floor(Math.random() * player.rank) + 1, level: player.level, hp: d.maxHp + (player.level*10), mp: d.maxMp + (player.level*5), maxHp: d.maxHp + (player.level*10), maxMp: d.maxMp + (player.level*5), atk: d.atk + (player.level*1), def: d.def + (player.level*1), matk: d.matk + (player.level*1), str: d.str + (player.level*1), dex: d.dex + (player.level*1), luk: d.luk + (player.level*1), int: d.int + (player.level*1), skills: d.skills };
    }
    
    sceneText.innerHTML = `[용병 영입]<br><img src="${jobData[guildRecruit.job].img}" style="width:50px; height:50px; margin-top:10px;"><br>${guildRecruit.rank}등급 모험가 <b>${guildRecruit.name}</b> (Lv.${guildRecruit.level}, ${guildRecruit.job}) 가 파티 합류를 원합니다.`;
    actionArea.innerHTML = `<div class="action-grid" style="grid-template-columns: 1fr;"><button class="btn" style="border-color:#4caf50;" onclick="acceptRecruit()">영입하기</button><button class="btn" onclick="openGuild()">거절 (돌아가기)</button></div>`;
}

function acceptRecruit() {
    player.party.push(guildRecruit); player.recruitUsedThisMonth = true; guildRecruit = null;
    updateAllStats(); showMessage("새로운 동료가 파티에 합류했습니다!", openGuild);
}

function showDismiss() {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `[동료 방출]<br>위로금 5,000G가 필요합니다.`;
    let html = `<div style="display:flex; flex-direction:column; gap:8px;">`;
    for(let i=1; i<player.party.length; i++) html += `<button class="btn" style="border-color:#e53935;" onclick="dismissCompanion(${i})">${player.party[i].name} 방출 (5000G)</button>`;
    html += `</div><button class="btn" style="margin-top:12px; width:100%;" onclick="openGuild()">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function dismissCompanion(index) {
    if (player.gold < 5000) return showMessage("위로금 5,000G가 부족하여 방출할 수 없습니다.");
    player.gold -= 5000; player.party.splice(index, 1); updateAllStats(); showMessage("위로금을 지급하고 동료를 방출했습니다.", showDismiss);
}

function openWorkplace() {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    let daysToWork = 30 - (((player.day - 1) % 30) + 1) + 1;
    sceneText.innerHTML = `[일터]<br>현재 달의 남은 일수: ${daysToWork}일<br>근무 시 말일까지 연속으로 일합니다 (일당 50G).`;
    let html = `<div style="display:flex; flex-direction:column; gap:8px;">`;
    ["식당", "대장간", "약국"].forEach(w => {
        let prof = player.proficiencies[w].toFixed(1);
        html += `<button class="btn" onclick="${prof >= 100 ? `showMessage('사업장 건축 기능은 준비 중입니다.')` : `doWork('${w}', ${daysToWork})`}">${prof >= 100 ? `${w} 운영 (준비중)` : `${w} 알바 (숙련도: ${prof})`}</button>`;
    });
    html += `</div><button class="btn" style="margin-top:12px; width:100%;" onclick="fadeTransition(renderTownUI)">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function doWork(place, days) {
    fadeTransition(() => {
        let earned = days * 50; player.gold += earned; player.proficiencies[place] += (days * 0.1);
        if(passTime(days)) return; 
        updateAllStats(); showMessage(`${days}일 동안 ${place}에서 일하여 ${earned}G를 벌었습니다.`, renderTownUI);
    });
}

// 💡 8 & 12. 상점 가격 500G 통일, 보유 갯수 표시
function openShop() {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `[상점]<br>소지금: ${player.gold}G<br>오늘의 원석 시세: ${player.orePrice}G/개`;
    let html = `<div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto;">`;
    
    html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.food} 식량 (500G) - 보유: ${player.items.food}개</div><button class="btn inv-btn" onclick="buyItem('food')">구매</button></div></div>`;
    html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.hp} HP포션 (500G) - 보유: ${player.items.hpPotion}개</div><button class="btn inv-btn" onclick="buyItem('hpPotion')">구매</button></div></div>`;
    html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.mp} MP포션 (500G) - 보유: ${player.items.mpPotion}개</div><button class="btn inv-btn" onclick="buyItem('mpPotion')">구매</button></div></div>`;
    html += `<div class="inv-item"><div class="inv-header"><div class="inv-info" style="color:#00e5ff;">${icons.ore} 원석 (${player.items.ore.toFixed(1)}개 보유)</div><button class="btn inv-btn" style="border-color:#00e5ff; color:#00e5ff;" onclick="sellOre()">전부 판매</button></div></div>`;
    
    player.essenceList.forEach((ess, idx) => {
        if(!player.equipped["정수"].some(e => e.id === ess.id)) {
            let sellPrice = 1000 * Math.pow(3, ess.tier - 1);
            html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.ore} <span style="color:#ce93d8;">[정수] ${ess.name}</span></div><button class="btn inv-btn" style="border-color:#ce93d8; color:#ce93d8;" onclick="sellEssence(${idx}, ${sellPrice})">판매 (${sellPrice}G)</button></div></div>`;
        }
    });

    player.equipList.forEach((eq, idx) => {
        let isEq = eq.type === '반지' ? player.equipped['반지'].some(r => r.id === eq.id) : (player.equipped[eq.type] && player.equipped[eq.type].id === eq.id);
        if(!isEq) {
            let sellPrice = eq.tier * 200;
            html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.equip} <span style="color:#ffd54f;">[${eq.type}] ${eq.name}</span></div><button class="btn inv-btn" style="border-color:#ffd54f; color:#ffd54f;" onclick="sellEquip(${idx}, ${sellPrice})">판매 (${sellPrice}G)</button></div></div>`;
        }
    });
    
    html += `</div><button class="btn" style="margin-top:12px; width:100%;" onclick="fadeTransition(renderTownUI)">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function buyItem(type) {
    if(player.gold < 500) return showMessage("골드가 부족합니다.");
    player.gold -= 500; player.items[type]++; updateAllStats(); openShop();
}

function sellOre() {
    if(player.items.ore <= 0) return showMessage("판매할 원석이 없습니다.");
    let total = Math.floor(player.items.ore * player.orePrice);
    player.gold += total; player.items.ore = 0; updateAllStats(); showMessage(`원석을 모두 팔아 ${total}G를 얻었습니다.`, openShop);
}

function sellEssence(index, price) { player.gold += price; player.essenceList.splice(index, 1); updateAllStats(); openShop(); }
function sellEquip(index, price) { player.gold += price; player.equipList.splice(index, 1); updateAllStats(); openShop(); }

// 💡 11. 창고 시스템
function openWarehouse() {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `[마을 창고]<br>가방의 물건을 안전하게 보관할 수 있습니다.`;
    
    let html = `<div style="display:flex; flex-direction:column; gap:12px; max-height: 250px; overflow-y:auto; padding-right:5px;">`;
    
    html += `<div style="color:#00e5ff; font-weight:bold; font-size:12px;">[ 내 가방 -> 창고 보관 ]</div>`;
    ['food', 'hpPotion', 'mpPotion', 'ore'].forEach(t => {
        if(player.items[t] > 0) {
            let name = t==='food'?'식량':t==='hpPotion'?'HP포션':t==='mpPotion'?'MP포션':'원석';
            html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${name} (${player.items[t]}개 보유)</div><button class="btn inv-btn" onclick="transferItem('store', '${t}')">1개 보관</button></div></div>`;
        }
    });
    player.equipList.forEach((eq, idx) => {
        let isEq = eq.type === '반지' ? player.equipped['반지'].some(r => r.id === eq.id) : (player.equipped[eq.type] && player.equipped[eq.type].id === eq.id);
        if(!isEq) html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">[${eq.type}] ${eq.name}</div><button class="btn inv-btn" onclick="transferEquip('store', ${idx})">보관</button></div></div>`;
    });
    player.essenceList.forEach((ess, idx) => {
        if(!player.equipped["정수"].some(e => e.id === ess.id)) html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">[정수] ${ess.name}</div><button class="btn inv-btn" onclick="transferEssence('store', ${idx})">보관</button></div></div>`;
    });

    html += `<div style="color:#ffd54f; font-weight:bold; font-size:12px; margin-top:10px;">[ 창고 -> 내 가방 꺼내기 ]</div>`;
    ['food', 'hpPotion', 'mpPotion', 'ore'].forEach(t => {
        if(player.warehouse.items[t] > 0) {
            let name = t==='food'?'식량':t==='hpPotion'?'HP포션':t==='mpPotion'?'MP포션':'원석';
            html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${name} (${player.warehouse.items[t]}개 보관중)</div><button class="btn inv-btn" onclick="transferItem('retrieve', '${t}')">1개 꺼내기</button></div></div>`;
        }
    });
    player.warehouse.equipList.forEach((eq, idx) => {
        html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">[${eq.type}] ${eq.name}</div><button class="btn inv-btn" onclick="transferEquip('retrieve', ${idx})">꺼내기</button></div></div>`;
    });
    player.warehouse.essenceList.forEach((ess, idx) => {
        html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">[정수] ${ess.name}</div><button class="btn inv-btn" onclick="transferEssence('retrieve', ${idx})">꺼내기</button></div></div>`;
    });

    html += `</div><button class="btn" style="margin-top:12px; width:100%" onclick="renderTownUI()">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function transferItem(action, type) {
    if (action === 'store' && player.items[type] > 0) { player.items[type]--; player.warehouse.items[type]++; }
    else if (action === 'retrieve' && player.warehouse.items[type] > 0) { player.warehouse.items[type]--; player.items[type]++; }
    saveGame(); openWarehouse();
}
function transferEquip(action, idx) {
    if (action === 'store') player.warehouse.equipList.push(player.equipList.splice(idx, 1)[0]);
    else if (action === 'retrieve') player.equipList.push(player.warehouse.equipList.splice(idx, 1)[0]);
    saveGame(); openWarehouse();
}
function transferEssence(action, idx) {
    if (action === 'store') player.warehouse.essenceList.push(player.essenceList.splice(idx, 1)[0]);
    else if (action === 'retrieve') player.essenceList.push(player.warehouse.essenceList.splice(idx, 1)[0]);
    saveGame(); openWarehouse();
}

function tryEnterDungeon() {
    if (player.day > 1 && player.dungeonEnteredThisMonth) {
        let nextMonthDays = (Math.floor((player.day - 1) / 30) + 1) * 30 + 1;
        return showMessage(`이번 달 던전 입장은 이미 마쳤습니다.<br>다음 포탈이 열릴 때까지 ${nextMonthDays - player.day}일 남았습니다.`);
    }
    startDungeonExpedition();
}

function generateFloor() {
    player.pos = {x: 1, y: 1}; player.visited = ['1,1']; player.targetPos = null;
    let bx, by; do { bx = Math.floor(Math.random() * 3); by = Math.floor(Math.random() * 3); } while(bx===1 && by===1);
    player.bossPos = {x: bx, y: by};
    let mx, my; do { mx = Math.floor(Math.random() * 3); my = Math.floor(Math.random() * 3); } while((mx===1 && my===1) || (mx===bx && my===by));
    player.monumentPos = {x: mx, y: my}; player.monumentFound = false;
}

function startDungeonExpedition() {
    player.dungeonEnteredThisMonth = true; player.inDungeon = true; 
    player.dungeonDay = 1; player.maxDungeonDay = 7; player.turn = 0; player.dungeonKills = 0;
    generateFloor(); 
    if (!player.dungeonGuideSeen) { player.dungeonGuideSeen = true; showDungeonGuide(); }
    updateDungeonTimer(); renderDungeonUI();
}

// 💡 6 & 13. 던전 내 턴 표시 및 킬수 표시 UI 갱신
function updateDungeonTimer() {
    const timerHud = document.getElementById('dungeon-time-hud');
    const turnHud = document.getElementById('dungeon-turn-hud');
    const killHud = document.getElementById('dungeon-kill-hud');
    const guideBtn = document.getElementById('guide-btn');
    
    if(!timerHud) return;
    if (player.inDungeon && !currentEnemy) {
        timerHud.classList.remove('hidden'); turnHud.classList.remove('hidden'); killHud.classList.remove('hidden'); guideBtn.classList.remove('hidden');
        document.getElementById('dt-turn-text').innerText = `남은 턴: ${player.maxTurn - player.turn} / ${player.maxTurn}`;
        document.getElementById('dt-kill-text').innerText = `⚔️ 처치: ${player.dungeonKills || 0}`;
        let dLeft = player.maxDungeonDay + 1 - player.dungeonDay;
        document.getElementById('dt-text').innerText = `남은 기간: ${dLeft}일`;
        document.getElementById('dt-bar').style.width = `${(dLeft / player.maxDungeonDay) * 100}%`;
    } else {
        timerHud.classList.add('hidden'); turnHud.classList.add('hidden'); killHud.classList.add('hidden'); guideBtn.classList.add('hidden');
    }
}

function getMinimapHTML() {
    let html = '<div id="minimap-wrapper"><div class="minimap">';
    for(let y=0; y<3; y++) {
        for(let x=0; x<3; x++) {
            let classes = 'mm-cell';
            if(player.pos.x === x && player.pos.y === y) classes += ' mm-current';
            else if(player.monumentFound && player.monumentPos && player.monumentPos.x === x && player.monumentPos.y === y) classes += ' mm-monument';
            else if(player.visited.includes(`${x},${y}`)) classes += ' mm-visited';
            html += `<div class="${classes}"></div>`;
        }
    }
    html += '</div></div>'; return html;
}

function renderDungeonUI() {
    updateDungeonTimer();
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    
    if (player.turn >= player.maxTurn) {
        sceneText.innerHTML = getMinimapHTML() + `[밤]<br>너무 어두워 잠을 청해야만 합니다.`;
        actionArea.innerHTML = `<div class="action-grid" style="grid-template-columns:1fr;"><div class="icon-btn" style="border-color:#4a148c; padding:24px;" onclick="showSleepMenu()"><span style="font-size:14px;">잠자기</span></div></div>`;
        return;
    }
    
    let currentName = mapGrid[player.pos.y][player.pos.x].n;
    sceneText.innerHTML = getMinimapHTML() + `[${player.floor}층 - ${currentName}]<br>어디로 가시겠습니까?`;

    let gridHtml = '<div class="compass-grid">';
    for(let y=0; y<3; y++) {
        for(let x=0; x<3; x++) {
            let isCurr = (player.pos.x === x && player.pos.y === y);
            let isAdj = Math.abs(x - player.pos.x) <= 1 && Math.abs(y - player.pos.y) <= 1 && !isCurr;
            if (isCurr) gridHtml += `<div class="compass-empty compass-current">현재위치</div>`;
            else if (isAdj) gridHtml += `<button class="compass-btn" onclick="startJourney(${x},${y})"><span>${mapGrid[y][x].n}</span></button>`;
            else gridHtml += `<div class="compass-empty">이동불가</div>`;
        }
    }
    gridHtml += `</div>`;
    
    if (player.monumentFound && player.pos.x === player.monumentPos.x && player.pos.y === player.monumentPos.y) {
        gridHtml += `<div class="action-grid" style="grid-template-columns:1fr; margin-top:12px;"><div class="icon-btn" style="border-color:#00e5ff; color:#00e5ff;" onclick="goNextFloor()">${icons.monument}<span>다음 층으로 올라가기</span></div></div>`;
    }

    gridHtml += `<div class="action-grid" style="grid-template-columns:1fr 1fr; margin-top:12px;"><div class="icon-btn" onclick="openInventory('dungeon')">${icons.bag}<span>가방</span></div><div class="icon-btn" style="border-color:#4a148c;" onclick="showSleepMenu()">${icons.sleep}<span>잠자기</span></div></div>`;
    actionArea.innerHTML = gridHtml;
}

function showSleepMenu() {
    showMessage("어떻게 주무시겠습니까?", null, [{txt: "하룻밤 자기 (턴 초기화)", act: "closeModal(); sleepInDungeon(false)"}, {txt: "던전 닫힐 때까지 푹 자기 (마을 복귀)", act: "closeModal(); sleepInDungeon(true)"}, {txt: "취소", act: "closeModal()"}]);
}

// 💡 10. 수면 시 모든 파티원 30% 회복
function sleepInDungeon(sleepUntilClose) {
    if (sleepUntilClose) {
        let daysLeft = player.maxDungeonDay + 1 - player.dungeonDay; passTime(daysLeft);
        return fadeTransition(() => { returnToTown(false); });
    }
    
    if (player.hunger <= 0) player.fatigue = Math.min(100, player.fatigue + 30);
    else if (player.hunger >= 100) player.fatigue = Math.max(0, player.fatigue - 50);
    else player.fatigue = Math.max(0, player.fatigue - 20); 
    
    player.party.forEach(p => {
        let s = p.isPlayer ? getTotalStats() : p;
        if(p.hp > 0) { p.hp = Math.min(s.maxHp, p.hp + Math.floor(s.maxHp * 0.3)); p.mp = Math.min(s.maxMp, p.mp + Math.floor(s.maxMp * 0.3)); }
    });

    player.turn = 0; player.hunger = 0; player.dungeonDay++; passTime(1);
    updateAllStats(); 
    
    if (player.dungeonDay > player.maxDungeonDay) fadeTransition(() => { returnToTown(false); });
    else renderDungeonUI();
}

// 💡 5. 위치 이동 논리 변경: 1칸 이동 시 즉시 1턴 소모 및 판정 발생
function startJourney(x, y) {
    player.turn++; player.pos = {x, y};
    if(!player.visited.includes(`${x},${y}`)) player.visited.push(`${x},${y}`);
    updateAllStats();
    
    let r = Math.random(); 
    if (r < 0.4) return startCombat(false); 
    
    if (player.bossPos && x === player.bossPos.x && y === player.bossPos.y) {
        return showMessage(`거대한 층의 군주의 기백이 느껴집니다...`, () => startCombat(true));
    } 
    else if (player.monumentPos && x === player.monumentPos.x && y === player.monumentPos.y && !player.monumentFound) {
        player.monumentFound = true;
        let expGain = 50 * player.floor; player.exp += expGain;
        let msg = `신비로운 푸른빛을 내뿜는 비석을 발견했습니다!<br>경험치 ${expGain} 획득.`;
        if (player.exp >= player.maxExp) { levelUp(); msg += `<br><span style="color:#4caf50;">LEVEL UP!</span>`; }
        return showMessage(msg, renderDungeonUI);
    }
    
    if (r >= 0.9) { 
        let msg = "";
        if (Math.random() < 0.02) { 
            let eqTier = Math.min(10, player.floor + Math.floor(Math.random() * 4)); 
            let newEq = generateEquip(eqTier); player.equipList.push(newEq);
            msg = `[보물상자] 눈부신 빛과 함께 [${newEq.name}] 획득!`;
        } else {
            let gainG = Math.floor(Math.random() * 50) + 10; player.gold += gainG; msg = `[보물상자] ${gainG}G 획득.`;
        }
        return showMessage(msg, renderDungeonUI);
    }
    renderDungeonUI();
}

function goNextFloor() {
    player.floor++; player.maxDungeonDay += 5; generateFloor();
    fadeTransition(() => { showMessage(`${player.floor}층에 진입했습니다!<br>던전 유지 기간이 5일 추가되었습니다.`, () => { renderDungeonUI(); }); });
}

function startCombat(isBoss = false) {
    updateDungeonTimer(); // 전투 시 HUD 숨김
    let f = player.floor;
    let baseHp = Math.floor(150 * Math.pow(3.5, f - 1) + (Math.random() * 20));
    let baseAtk = Math.floor(40 * Math.pow(3.5, f - 1) + (Math.random() * 10));
    let baseDef = Math.floor(12 * Math.pow(3, f - 1) + (Math.random() * 5));
    
    if (isBoss) {
        let bTier = f + 3; let bName = floorBosses[f] || `심연의 군주`;
        currentEnemy = { isBoss: true, tier: bTier, name: `[${f}층 군주] ${bName}`, img: `https://api.dicebear.com/7.x/pixel-art/svg?seed=Boss${f}`, maxHp: Math.floor(baseHp * 2.5), hp: Math.floor(baseHp * 2.5), atk: Math.floor(baseAtk * 1.5), def: Math.floor(baseDef * 1.5) };
        showMessage(`층의 군주가 등장했다! 도망칠 것인가 싸울 것인가!`, () => { combatState.turnIndex = 0; renderCombatTurn("", false); });
    } else {
        let availableMobs = floorMonsters[f] || monsterTypes;
        let mName = availableMobs[Math.floor(Math.random() * availableMobs.length)];
        let mImg = monsterImgs[mName] ? monsterImgs[mName] : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${mName}${f}`;
        currentEnemy = { isBoss: false, tier: f, name: `${f}등급 ${mName}`, img: mImg, maxHp: baseHp, hp: baseHp, atk: baseAtk, def: baseDef };
        combatState.turnIndex = 0; renderCombatTurn("", false);
    }
}

function renderCombatTurn(logMsg = "", isWaiting = false) {
    if (!isWaiting) while(combatState.turnIndex < player.party.length && player.party[combatState.turnIndex].hp <= 0) combatState.turnIndex++;
    if (combatState.turnIndex >= player.party.length && !isWaiting) { executeEnemyTurn(); return; }

    let p = Math.max(0, (currentEnemy.hp / currentEnemy.maxHp) * 100);
    let actorName = isWaiting ? "진행 중..." : (player.party[combatState.turnIndex] ? player.party[combatState.turnIndex].name || player.party[combatState.turnIndex].job : "대기...");
    
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `
        <div id="monster-sprite"><img src="${currentEnemy.img}" class="monster-img"></div>
        <div style="font-weight:bold; color:#e53935; margin:5px 0;">${currentEnemy.name} (HP: ${currentEnemy.hp}/${currentEnemy.maxHp})</div>
        <div style="width:100%; height:6px; background:#222; margin-bottom:10px;"><div style="width:${p}%; height:100%; background:#e53935; transition:width 0.3s;"></div></div>
        <div style="font-size:12px; color:#aaa; margin-bottom:10px; min-height:18px;">${logMsg}</div>
        <div style="font-weight:bold; color:#ffd54f;">👉 현재 턴: ${actorName}</div>
    `;

    if (isWaiting) { actionArea.innerHTML = `<div style="text-align:center; padding:20px; color:#777;">( 잠시 대기... )</div>`; return; }

    let runBtn = "";
    if (combatState.turnIndex === 0) runBtn = currentEnemy.isBoss ? `<div class="icon-btn" onclick="combatAction('run')">${icons.run}<span>도망</span></div>` : `<div class="icon-btn" onclick="showMessage('일반 몬스터와는 물러설 수 없습니다!')">${icons.run}<span style="color:#555">불가</span></div>`;
    
    actionArea.innerHTML = `<div class="action-grid" style="grid-template-columns:1fr 1fr;"><div class="icon-btn" onclick="combatAction('attack')">${icons.attack}<span>공격</span></div><div class="icon-btn" onclick="showSkillList()">${icons.skill}<span>스킬</span></div><div class="icon-btn" onclick="openInventory('combat')">${icons.bag}<span>가방</span></div>${runBtn}</div>`;
}

// 💡 2 & 3. 등급(rank) 비례 스킬 언락 및 플레이어 전용 정수 스킬 획득
function showSkillList() {
    let actor = player.party[combatState.turnIndex];
    let availableSkills = jobData[actor.job].skills.filter(s => actor.rank >= s.rank);
    
    if (actor.isPlayer) {
        player.equipped["정수"].forEach(e => { if (e.skill) availableSkills.push(e.skill); });
    }

    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `[스킬 선택 - ${actor.name||actor.job}]`;
    
    let html = `<div class="action-grid" style="grid-template-columns: 1fr;">`;
    availableSkills.forEach((s, idx) => {
        html += `<button class="btn" style="border-color:#00e5ff;" onclick="combatAction('skill', ${idx})">${s.n} (MP ${s.mp}) - 계수 ${s.mult}x</button>`;
    });
    html += `<button class="btn" onclick="renderCombatTurn('행동을 취소했습니다.', false)">돌아가기</button></div>`;
    actionArea.innerHTML = html;
}

function calcMemberDamage(member, isSkill, skillMult = 1.0) {
    let dmg = 0; let s = member;
    if (member.isPlayer) s = getTotalStats();
    
    switch(member.job) {
        case '바바리안': dmg = (s.atk*1.0) + (s.str*0.6) + (s.def*0.3); break;
        case '엘프': dmg = (s.atk*1.0) + (s.dex*0.8) + (s.str*0.4); break;
        case '드워프': dmg = (s.atk*1.0) + (s.def*0.5) + (s.str*0.3); break;
        case '마법사': dmg = (s.matk*1.2) + (s.int*0.8) + (s.maxMp*0.1); break;
        case '도적': dmg = (s.atk*1.0) + (s.luk*0.8) + (s.dex*0.5); break;
        case '소환사': dmg = (s.matk*1.0) + (s.int*0.7) + (s.maxMp*0.08); break;
    }
    return Math.floor(dmg * (isSkill ? skillMult : 1.0));
}

function combatAction(act, skillIdx) {
    let actor = player.party[combatState.turnIndex];
    let log = ""; let dmg = 0;
    
    if (act === 'attack') {
        dmg = Math.max(1, calcMemberDamage(actor, false) - currentEnemy.def); log = `[${actor.name||actor.job}]의 공격! 적에게 ${dmg} 피해.`;
    } else if (act === 'skill') {
        let availableSkills = jobData[actor.job].skills.filter(s => actor.rank >= s.rank);
        if (actor.isPlayer) player.equipped["정수"].forEach(e => { if (e.skill) availableSkills.push(e.skill); });
        
        let sk = availableSkills[skillIdx];
        if (actor.mp < sk.mp) return renderCombatTurn("마나가 부족합니다!", false);
        actor.mp -= sk.mp; dmg = Math.max(1, calcMemberDamage(actor, true, sk.mult) - currentEnemy.def); 
        log = `[${actor.name||actor.job}]의 [${sk.n}]! 적에게 ${dmg} 피해.`;
    } else if (act === 'run') {
        if (!currentEnemy.isBoss) return;
        if (Math.random() < Math.max(0.1, 0.7 - (player.floor * 0.1))) { currentEnemy = null; return showMessage("도망쳤습니다!", renderDungeonUI); }
        else { log = "도망 실패! 빈틈을 보였다!"; }
    }
    
    if(act !== 'run') currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    renderCombatTurn(log, true); 
    
    playShakeEffect(() => {
        updateAllStats();
        if (currentEnemy.hp <= 0) return executeWin(log);
        
        combatState.turnIndex++;
        let isAllDead = true; let tempIdx = combatState.turnIndex;
        while(tempIdx < player.party.length) { if(player.party[tempIdx].hp > 0) { isAllDead = false; break; } tempIdx++; }
        
        if (isAllDead || combatState.turnIndex >= player.party.length) setTimeout(executeEnemyTurn, 400); 
        else renderCombatTurn(log, false); 
    });
}

function executeEnemyTurn() {
    let alive = player.party.filter(p => p.hp > 0);
    if(alive.length === 0) return returnToTown(true);
    
    let target = alive[Math.floor(Math.random() * alive.length)];
    let tDef = target.isPlayer ? getTotalStats().def : target.def;
    let eDmg = Math.max(1, currentEnemy.atk - tDef); 
    
    target.hp = Math.max(0, target.hp - eDmg); updateAllStats(); 
    let log = `[적의 공격] ${target.name||target.job}에게 ${eDmg} 피해를 입혔다.`;
    renderCombatTurn(log, true);
    
    playShakeEffect(() => {
        if (player.party[0].hp <= 0) return fadeTransition(() => { returnToTown(true); });
        combatState.turnIndex = 0; renderCombatTurn(log, false); 
    });
}

function executeWin(lastLog) {
    let wLog = `${lastLog}<br><br>전투 승리! `; 
    let gExp = currentEnemy.isBoss ? Math.floor(150 * Math.pow(2.5, player.floor - 1)) : Math.floor(40 * Math.pow(2.5, player.floor - 1));
    let dropTier = currentEnemy.tier;
    let dRate = dropRates[Math.min(9, dropTier - 1)] || 0.001; 
    
    player.dungeonKills++; // 처치 몬스터 수 증가
    
    if (currentEnemy.isBoss || Math.random() < dRate) {
        let newEq = generateEquip(dropTier); player.equipList.push(newEq); wLog += `<br><span style="color:#ffd54f">🎉 희귀한 장비 [${newEq.name}] 획득!</span>`;
    }

    if (currentEnemy.isBoss || Math.random() < dRate) {
        let mobName = currentEnemy.name.replace(/\[.*?층 군주\] |\[군주\] |\d+등급 /g, '');
        let ess = { 
            id: Date.now()+Math.random(), name: `${dropTier}등급 ${mobName}의 정수`, tier: dropTier, passive: `[패시브] 올스탯 +${dropTier}%`,
            skill: { n: `${mobName}의 일격`, mp: 15 + (dropTier*5), mult: 1.5 + (dropTier*0.2) } 
        };
        player.essenceList.push(ess);
        wLog += `<br><span style="color:#00e5ff">💎 신비로운 [${ess.name}] 획득! (스킬: ${ess.skill.n} 내장)</span>`;
    }
    
    if (currentEnemy.isBoss) { player.bossPos = null; }

    let goldGain = (currentEnemy.isBoss ? 300 : 50) * player.floor; let perGold = goldGain / player.party.length; player.gold += perGold;
    let oreGain = currentEnemy.isBoss ? 3 : 1; let perOre = oreGain / player.party.length; player.items.ore += perOre;
    
    wLog += `<br>골드 ${goldGain}G (인당 +${perGold.toFixed(1)}G), 원석 ${oreGain}개 (인당 +${perOre.toFixed(2)}개), 경험치 ${gExp} 획득.`;
    
    player.exp += gExp; 
    if (player.exp >= player.maxExp) { levelUp(); wLog += `<br><span style="color:#4caf50; font-weight:bold;">LEVEL UP! 파티원의 체/마가 회복되었습니다.</span>`; }
    updateAllStats(); return showMessage(wLog, () => { currentEnemy = null; renderDungeonUI(); });
}

// 💡 13. 마을 복귀 시 킬 수 비례 보상금 처리
function returnToTown(isGameOver) {
    player.inDungeon = false; currentEnemy = null;
    let kills = player.dungeonKills || 0;
    let reward = Math.floor(kills / 5) * 500;
    player.dungeonKills = 0; player.bossPos = null; player.monumentPos = null; player.targetPos = null;
    
    let msg = "";
    if (isGameOver) {
        let penalty = Math.floor(player.maxExp * 0.15); player.exp = Math.max(0, player.exp - penalty);
        player.gold = Math.floor(player.gold / 2); player.items = { food: 0, hpPotion: 0, mpPotion: 0, ore: 0 };
        player.hunger = 0; player.fatigue = 0;
        msg = `[치명타] 파티장이 기절했습니다...<br>가진 소모품 전부와 골드 절반을 잃고 마을로 실려갑니다.`;
    } else {
        msg = "무사히 던전에서 귀환했습니다!";
    }

    if (reward > 0) {
        player.gold += reward;
        msg += `<br><br><span style="color:#ffd54f">마을 주민들이 당신의 활약(몬스터 ${kills}마리 처치)에 깊이 감사하며 <b>${reward}G</b>의 후원금을 건넸습니다!</span>`;
    }
    
    let ts = getTotalStats(); player.party[0].hp = ts.maxHp; player.party[0].mp = ts.maxMp;
    saveGame();
    showMessage(msg, renderTownUI);
}

function openInventory(context) {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `[가방 및 상태창] (현재 ${player.rank}등급 모험가)`;
    let backFunc = context === 'town' ? 'renderTownUI()' : (context === 'combat' ? `renderCombatTurn('가방을 닫았다.', false)` : 'renderDungeonUI()');
    
    let html = `<div style="display:flex; flex-direction:column; gap:8px;">
        <div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.food} 식량 (${player.items.food}) (허기 100 회복)</div><button class="btn inv-btn" onclick="useItem('food','${context}')">먹기</button></div></div>
        <div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.hp} HP포션 (${player.items.hpPotion})</div><button class="btn inv-btn" onclick="useItem('hpPotion','${context}')">사용</button></div></div>
        <div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.mp} MP포션 (${player.items.mpPotion})</div><button class="btn inv-btn" onclick="useItem('mpPotion','${context}')">사용</button></div></div>
    `;

    player.essenceList.forEach(ess => {
        let isEq = player.equipped["정수"].some(e => e.id === ess.id);
        html += `<div class="inv-item" style="${isEq ? 'border-color:#00e5ff;' : ''}"><div class="inv-header"><div class="inv-info">${icons.ore} <span style="color:${isEq ? '#00e5ff' : '#eee'};">[정수] ${ess.name} ${isEq ? '(장착중)' : ''}</span></div><button class="btn inv-btn" onclick="toggleEssence(${ess.id}, '${context}')">${isEq ? '파괴(100G)' : '장착'}</button></div><div class="inv-stats">${ess.passive}${ess.skill ? ` / ${ess.skill.n}` : ''}</div></div>`;
    });

    player.equipList.forEach(eq => {
        let isEq = eq.type === '반지' ? player.equipped['반지'].some(r => r.id === eq.id) : (player.equipped[eq.type] && player.equipped[eq.type].id === eq.id);
        let statText = Object.keys(eq.stats).map(k => `${statNames[k]}+${eq.stats[k]}`).join(', ');
        html += `<div class="inv-item" style="${isEq ? 'border-color:#ffd54f;' : ''}"><div class="inv-header"><div class="inv-info">${icons.equip} <span style="color:${isEq ? '#ffd54f' : '#eee'};">[${eq.type}] ${eq.name}</span></div><button class="btn inv-btn" onclick="toggleEquip(${eq.id}, '${context}')">${isEq ? '해제' : '장착'}</button></div><div class="inv-stats">${statText}</div></div>`;
    });

    html += `</div><button class="btn" style="margin-top:12px; width:100%" onclick="${backFunc}">돌아가기</button>`;
    if(actionArea) actionArea.innerHTML = html;
}

function toggleEquip(id, context) {
    let eq = player.equipList.find(e => e.id === id); if (!eq) return;
    if (eq.type === '반지') {
        let idx = player.equipped['반지'].findIndex(r => r.id === id);
        if (idx > -1) player.equipped['반지'].splice(idx, 1);
        else { if (player.equipped['반지'].length >= 4) return showMessage("반지는 최대 4개까지만 착용 가능합니다."); player.equipped['반지'].push(eq); }
    } else {
        if (player.equipped[eq.type] && player.equipped[eq.type].id === id) player.equipped[eq.type] = null; else player.equipped[eq.type] = eq;
    }
    updateAllStats(); openInventory(context);
}

function toggleEssence(id, context) {
    let isEq = player.equipped["정수"].some(e => e.id === id);
    if (isEq) showMessage("정말 파괴하시겠습니까? (100G 소모)", null, [{txt:"파괴하기", act:`executeDestroyEssence(${id}, '${context}')`}, {txt:"취소", act:"closeModal()"}]);
    else {
        if (player.equipped["정수"].length >= 2) return showMessage("정수는 최대 2개까지만 장착 가능합니다.");
        let ess = player.essenceList.find(e => e.id === id); player.equipped["정수"].push(ess); updateAllStats(); openInventory(context);
    }
}

function executeDestroyEssence(id, context) {
    closeModal(); if (player.gold < 100) return showMessage("골드가 부족합니다."); player.gold -= 100;
    player.equipped["정수"] = player.equipped["정수"].filter(e => e.id !== id); player.essenceList = player.essenceList.filter(e => e.id !== id);
    updateAllStats(); openInventory(context);
}

// 💡 9. 포션 대상 선택 UI
function useItem(type, context) {
    if (player.items[type] <= 0) return showMessage("부족합니다!");
    
    if (type === 'food') {
        player.items.food--; player.hunger = 100; 
        showMessage("식량 섭취! 허기가 100으로 회복되었습니다.", () => openInventory(context));
        updateAllStats();
        return;
    }

    if (player.party.length > 1) {
        let btns = player.party.map((p, i) => ({ txt: `${p.name||p.job}에게 사용`, act: `closeModal(); applyItem('${type}', ${i}, '${context}')` }));
        btns.push({txt: "취소", act: "closeModal()"});
        showMessage("누구에게 사용할까요?", null, btns);
    } else {
        applyItem(type, 0, context);
    }
}

function applyItem(type, targetIdx, context) {
    player.items[type]--;
    let target = player.party[targetIdx];
    let ts = target.isPlayer ? getTotalStats() : target;
    
    if (type === 'hpPotion') {
        target.hp = Math.min(ts.maxHp, target.hp + 50);
        showMessage(`${target.name||target.job}의 HP가 50 회복되었습니다!`, () => openInventory(context));
    } else if (type === 'mpPotion') {
        target.mp = Math.min(ts.maxMp, target.mp + 30);
        showMessage(`${target.name||target.job}의 MP가 30 회복되었습니다!`, () => openInventory(context));
    }
    updateAllStats();
}

function generateEquip(tier) {
    let type = equipTypes[Math.floor(Math.random() * equipTypes.length)]; let numStats = Math.min(tier, 9);
    let statPool = ['atk', 'matk', 'str', 'dex', 'luk', 'int', 'maxHp', 'maxMp', 'def']; statPool.sort(() => 0.5 - Math.random());
    const minVals = [0, 1, 3, 8, 13, 20, 30, 45, 65, 90, 120]; const maxVals = [0, 5, 10, 15, 25, 40, 60, 85, 115, 150, 200];
    let stats = {}; for(let i=0; i<numStats; i++) stats[statPool[i]] = Math.floor(Math.random() * (maxVals[tier] - minVals[tier] + 1)) + minVals[tier];
    return { id: Date.now() + Math.random(), type: type, name: `T${tier} ${type}`, tier: tier, stats: stats };
}