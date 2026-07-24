// 💡 Firebase 설정 (자동 연동 완료)
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

const f = (num) => Math.floor(num).toLocaleString('ko-KR');
const getPlayerSprite = (size = 100) => `<div id="player-sprite" style="width:${size}px; height:${size}px;"><img src="${player.party[0].img}" class="player-img"></div>`;

function setBackground(type) {
    let bg = document.getElementById('dungeon-bg');
    bg.classList.remove('hidden');
    if (type === 'town') { bg.style.backgroundImage = "url('image/town.png')"; bg.style.opacity = '0.7'; } 
    else if (type === 'guild') { bg.style.backgroundImage = "url('image/guild.png')"; bg.style.opacity = '0.7'; } 
    else if (type === 'dungeon') { let bgFloor = Math.min(player.floor, 2); bg.style.backgroundImage = `url('image/floor${bgFloor}.png')`; bg.style.opacity = '0.4'; }
}

const baseClasses = {
    '바바리안': { img: 'image/barbarian.png', desc: '특성을 선택하여 다양한 전사로 성장합니다.' },
    '엘프': { img: 'image/elf.png', desc: '빠른 몸놀림과 날카로운 활시위로 적을 제압하는 궁수' },
    '드워프': { img: 'image/dwarf.png', desc: '강철 같은 방어력으로 최전방을 지키는 철벽의 수호자' },
    '마법사': { img: 'image/magician.png', desc: '특성을 선택하여 파괴 또는 회복 마법을 다룹니다.' },
    '도적': { img: 'image/assassin.png', desc: '행운을 이용해 치명적인 한 방을 노리는 암살자' },
    '소환사': { img: 'image/summoner.png', desc: '소환수의 힘을 빌려 전투를 지휘하는 지휘관' }
};

const jobData = {
    '바바리안(탱커)': { img: 'image/barbarian.png', desc: '몬스터의 공격을 대신 맞아주는 파티의 방패', atk:15, matk:5, str:20, dex:5, luk:10, int:5, maxHp:220, maxMp:40, def:25, skills: [{n:'도발', rank:1, mp:15, mult:1.5}, {n:'철벽 방어', rank:2, mp:25, mult:2.0}, {n:'대지 가르기', rank:3, mp:45, mult:2.5}] },
    '바바리안(브루저)': { img: 'image/barbarian.png', desc: '공격과 방어의 밸런스', atk:20, matk:5, str:20, dex:10, luk:10, int:5, maxHp:180, maxMp:40, def:15, skills: [{n:'분쇄', rank:1, mp:20, mult:1.6}, {n:'대지 강타', rank:2, mp:35, mult:2.3}, {n:'돌진', rank:3, mp:55, mult:3.1}] },
    '바바리안(광전사)': { img: 'image/barbarian.png', desc: '자신을 희생하여 강력한 공격', atk:30, matk:5, str:25, dex:10, luk:5, int:5, maxHp:150, maxMp:40, def:5, skills: [{n:'광분', rank:1, mp:25, mult:1.8}, {n:'찢기', rank:2, mp:40, mult:2.6}, {n:'학살', rank:3, mp:65, mult:3.6}] },
    '엘프': { img: 'image/elf.png', desc: '빠른 몸놀림의 궁수', atk:20, matk:10, str:15, dex:25, luk:10, int:10, maxHp:110, maxMp:60, def:5, skills: [{n:'연사', rank:1, mp:20, mult:1.5}, {n:'관통 화살', rank:2, mp:35, mult:2.2}, {n:'폭풍의 시위', rank:3, mp:55, mult:3.0}] },
    '드워프': { img: 'image/dwarf.png', desc: '철벽의 수호자', atk:22, matk:10, str:15, dex:10, luk:10, int:10, maxHp:220, maxMp:50, def:20, skills: [{n:'방패 치기', rank:1, mp:20, mult:1.5}, {n:'지진', rank:2, mp:35, mult:2.2}, {n:'철벽의 일격', rank:3, mp:55, mult:3.0}] },
    '마법사(전투마법)': { img: 'image/magician.png', desc: '파괴적인 마법 공격', atk:10, matk:30, str:5, dex:10, luk:10, int:25, maxHp:80, maxMp:180, def:5, skills: [{n:'파이어볼', rank:1, mp:30, mult:1.8}, {n:'라이트닝', rank:2, mp:50, mult:2.6}, {n:'메테오', rank:3, mp:80, mult:4.0}] },
    '마법사(회복마법)': { img: 'image/magician.png', desc: '아군을 치유하며 공격하는 마법사', atk:5, matk:20, str:5, dex:10, luk:15, int:20, maxHp:90, maxMp:200, def:5, skills: [{n:'홀리 애로우', rank:1, mp:25, mult:1.1, isHolyArrow:true}, {n:'치유의 빛', rank:2, mp:45, mult:2.5, isHeal:true}, {n:'성역', rank:3, mp:70, mult:4.0, isHeal:true}] },
    '도적': { img: 'image/assassin.png', desc: '치명적인 한 방', atk:22, matk:10, str:10, dex:20, luk:25, int:10, maxHp:90, maxMp:50, def:5, skills: [{n:'기습', rank:1, mp:20, mult:1.5}, {n:'그림자 베기', rank:2, mp:35, mult:2.2}, {n:'암살', rank:3, mp:55, mult:3.0}] },
    '소환사': { img: 'image/summoner.png', desc: '마수 소환', atk:10, matk:20, str:10, dex:15, luk:10, int:25, maxHp:100, maxMp:120, def:5, skills: [{n:'마력탄', rank:1, mp:25, mult:1.5}, {n:'정령의 분노', rank:2, mp:45, mult:2.3}, {n:'고대 마수 소환', rank:3, mp:75, mult:3.3}] }
};

let player = {
    gold: 1000, day: 1, year: 1, month: 1, monthsWithoutKill: 0,
    rank: 1, level: 1, exp: 0, maxExp: 150, hunger: 100, maxHunger: 100, fatigue: 0, prestige: 0,
    inDungeon: false, dungeonDay: 1, maxDungeonDay: 7, floor: 1, turn: 0, maxTurn: 20, dungeonKills: 0, dungeonGuideSeen: false,
    pos: {x: 1, y: 1}, visited: ['1,1'], targetPos: null, stepsLeft: 0,
    mobKills: {}, eventClaimed: {},
    items: { food: 5, hpPotion: 10, mpPotion: 10, ore: 0, envelope: 0, petBox: 0 },
    equipList: [], essenceList: [],
    equipped: { "모자": null, "상의": null, "하의": null, "신발": null, "장갑": null, "무기": null, "망토": null, "팔찌": null, "목걸이": null, "반지": [], "정수": [], "펫": null },
    warehouse: { gold: 0, items: { food: 0, hpPotion: 0, mpPotion: 0, ore: 0 }, equipList: [], essenceList: [] }, 
    bossPos: null, monumentPos: null, monumentFound: false, dungeonEnteredThisMonth: false, recruitUsedThisMonth: false, arenaEnteredThisMonth: false, academyUsedThisMonth: false, orePrice: 500,
    proficiencies: { "식당": 0, "대장간": 0, "약국": 0 }, party: [] 
};

const namePool = ["철수", "영희", "지훈", "수민", "민수", "다은", "하준", "아서", "레온", "루시", "올리비아", "엘리엇", "제인", "카일", "에반", "켄지", "사쿠라", "류", "유키", "렌", "아야카", "이오리", "소라"];
const equipTypes = ["모자", "상의", "하의", "신발", "장갑", "무기", "망토", "팔찌", "반지", "목걸이"];
const statNames = { atk:'공격력', matk:'마력', str:'힘', dex:'민첩', luk:'행운', int:'지능', maxHp:'체력', maxMp:'마나', def:'방어력' };
const dropRates = [0.10, 0.05, 0.025, 0.01, 0.007, 0.005, 0.004, 0.003, 0.002, 0.001];

const monsterImgs = { 
    "동굴 슬라임": "image/caveslime.png", 
    "동굴 박쥐": "image/cavebat.png", 
    "지하 고블린": "image/undergroundgoblin.png", 
    "굴착기 고블린": "image/minergoblin.png", 
    "스켈레톤 워리어": "image/skeletonwarrior.png",
    "유령 셰이드": "image/ghostshade.png",
    "구울": "image/ghoul.png",
    "본 아처": "image/bonearcher.png",
    "심연의 포식자, 그라둠": "image/gradum.png",
    "불사의 군신, 발키르": "image/valkyr.png"
};

const floorMonsters = { 1: ["지하 고블린", "굴착기 고블린"], 2: ["스켈레톤 워리어", "유령 셰이드", "구울", "본 아처"] };
const floorBosses = { 1: "심연의 포식자, 그라둠", 2: "불사의 군신, 발키르" };
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
    arena: `<svg viewBox="0 0 24 24" fill="#ffc107"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>`,
    warehouse: `<svg viewBox="0 0 24 24" fill="#bbb"><path d="M4 6h16v2H4zm2 4h12v12H6z M11 12h2v4h-2z"/></svg>`,
    equip: `<svg viewBox="0 0 24 24" fill="#ffd54f"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`,
    ore: `<svg viewBox="0 0 24 24" fill="#00e5ff"><path d="M12 2L2 12l10 10 10-10L12 2zm0 14.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"/></svg>`,
    auto: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`,
    event: `<svg viewBox="0 0 24 24" fill="#ff9800"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
};

let guildRecruit = null;
let currentEnemy = null; 
let combatState = { turnIndex: 0 }; 
let arenaState = { round: 16, fighters: [] }; 
let isAutoCombat = false; 

function googleLogin() { auth.signInWithPopup(provider).then((result) => { currentUser = result.user; fadeTransition(() => { checkFirestoreSave(currentUser.uid); }); }).catch((error) => { alert("로그인에 실패했습니다: " + error.message); }); }

function checkFirestoreSave(uid) {
    db.collection("saves").doc(uid).get().then((doc) => {
        document.getElementById('login-screen').classList.add('hidden');
        const screen = document.getElementById('save-check-screen'); const text = document.getElementById('save-status-text'); const btns = document.getElementById('save-action-btns');
        screen.classList.remove('hidden');

        if (doc.exists) {
            localStorage.setItem('temp_firestore_save', JSON.stringify(doc.data()));
            text.innerHTML = "구글 계정에 연동된 클라우드 데이터가 있습니다.";
            btns.innerHTML = `<button class="btn" style="border-color:#4caf50; color:#4caf50; font-weight:bold; padding:16px;" onclick="continueGame()">이어하기</button><button class="btn" style="border-color:#e53935; color:#e53935; padding:16px;" onclick="startNewGameConfirm()">새로하기</button><p style="color:#e53935; font-size:11.5px; text-align:center; margin-top:-5px;">※ 새로 시작하면 기존 데이터는 영구 삭제됩니다.</p>`;
        } else {
            text.innerHTML = "저장된 데이터가 없습니다. 새로운 모험을 시작합니다.";
            btns.innerHTML = `<button class="btn" style="border-color:#4caf50; color:#4caf50; font-weight:bold; padding:16px;" onclick="startNewGame()">새로하기</button>`;
        }
    }).catch((error) => { alert("데이터를 불러오는 중 에러가 발생했습니다."); });
}

function saveGame() { if (currentUser) { db.collection("saves").doc(currentUser.uid).set(player).catch((error) => { console.error("서버 저장 실패:", error); }); } }

function ensureSaveCompatibility() {
    if(player.year === undefined) { player.year = 1; player.month = 1; }
    if(player.prestige === undefined) player.prestige = 0;
    if(player.monthsWithoutKill === undefined) player.monthsWithoutKill = 0;
    if(!player.bossKills) player.bossKills = {};
    if(!player.mobKills) player.mobKills = {};
    if(!player.eventClaimed) player.eventClaimed = {};
    if(player.items.envelope === undefined) player.items.envelope = 0;
    if(player.items.petBox === undefined) player.items.petBox = 0;
    if(player.arenaEnteredThisMonth === undefined) player.arenaEnteredThisMonth = false;
    if(player.academyUsedThisMonth === undefined) player.academyUsedThisMonth = false;
    if(player.warehouse.gold === undefined) player.warehouse.gold = 0;
    if(player.equipped['펫'] === undefined) player.equipped['펫'] = null;
    
    if (player.equipped['반지'] && player.equipped['반지'].length > 2) {
        let removedRings = player.equipped['반지'].splice(2);
        player.equipList.push(...removedRings);
    }
}

function continueGame() {
    let savedData = localStorage.getItem('temp_firestore_save');
    if(savedData) {
        player = JSON.parse(savedData); ensureSaveCompatibility();
        fadeTransition(() => {
            document.getElementById('save-check-screen').classList.add('hidden');
            document.getElementById('game-header').classList.remove('hidden');
            document.getElementById('main-screen').classList.remove('hidden');
            if(player.inDungeon) renderDungeonUI(); else renderTownUI();
            updateDungeonTimer();
        });
    } else startNewGame();
}

function startNewGameConfirm() { showMessage("정말로 기존 데이터를 삭제하고 새로 시작하시겠습니까?", null, [{txt: "네 (삭제)", act: "closeModal(); startNewGame()"}, {txt: "아니오", act: "closeModal()"}]); }

function startNewGame() {
    if(currentUser) db.collection("saves").doc(currentUser.uid).delete(); localStorage.removeItem('temp_firestore_save');
    fadeTransition(() => { document.getElementById('save-check-screen').classList.add('hidden'); document.getElementById('game-header').classList.remove('hidden'); showClassSelection(); });
}

function goToLogin() { fadeTransition(() => { document.getElementById('title-screen').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); }); }
function fadeTransition(callback) { const overlay = document.getElementById('fade-overlay'); if (!overlay) return callback(); overlay.style.opacity = '1'; setTimeout(() => { callback(); overlay.style.opacity = '0'; }, 300); }
function playShakeEffect(callback) { const container = document.getElementById('game-container'); container.classList.add('shake'); setTimeout(() => { container.classList.remove('shake'); setTimeout(() => { if (callback) callback(); }, 300); }, 300); }
function showMessage(msg, callback, buttons) {
    const modal = document.getElementById('game-modal'); if (!modal) return; document.getElementById('modal-text').innerHTML = msg;
    let btnArea = document.getElementById('modal-btn-area');
    if (buttons && btnArea) btnArea.innerHTML = buttons.map(b => `<button class="modal-btn" onclick="${b.act}">${b.txt}</button>`).join('');
    else if (btnArea) { btnArea.innerHTML = `<button class="modal-btn" id="default-modal-btn">확인</button>`; document.getElementById('default-modal-btn').onclick = () => { modal.classList.add('hidden'); if(callback) callback(); }; }
    modal.classList.remove('hidden');
}
function closeModal() { const modal = document.getElementById('game-modal'); if(modal) modal.classList.add('hidden'); }

function confirmLobby() { showMessage("로비 화면으로 나가시겠습니까?<br>현재 진행 상황은 안전하게 클라우드에 자동 저장되어 있습니다.", null, [{txt: "나가기", act: "returnToLobby()"}, {txt: "취소", act: "closeModal()"}]); }
function returnToLobby() { location.reload(); }

function getCombatPower(member, idx = 0) {
    let s = member.isPlayer ? getTotalStats(0) : getTotalStats(idx);
    return Math.floor(s.atk*2.5 + s.matk*2.5 + s.def*2 + s.maxHp*0.5 + s.maxMp*0.2 + s.str*1.5 + s.dex*1.5 + s.int*1.5 + s.luk*1.5);
}

function showCPToast(oldCP, newCP) {
    let diff = newCP - oldCP;
    if (diff === 0) return;
    const toast = document.getElementById('cp-toast');
    toast.style.color = diff > 0 ? '#ff5252' : '#4fc3f7';
    toast.innerHTML = `전투력 ${diff > 0 ? '▲' : '▼'} ${f(Math.abs(diff))}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1000);
}

function getTotalStats(memberIndex = 0) {
    let member = player.party[memberIndex];
    if(!member) return {maxHp:1, maxMp:1}; 
    let s = { ...member };
    
    if (memberIndex === 0) {
        for (let slot in player.equipped) {
            if (slot === "반지") player.equipped["반지"].forEach(ring => { for (let st in ring.stats) s[st] += ring.stats[st]; });
            else if (slot !== "정수" && slot !== "펫" && player.equipped[slot]) { let eq = player.equipped[slot]; for (let st in eq.stats) s[st] += eq.stats[st]; }
        }
    }
    
    let rMult = Math.pow(3, member.rank - 1);
    s.atk *= rMult; s.matk *= rMult; s.def *= rMult; 
    s.str *= rMult; s.dex *= rMult; s.luk *= rMult; s.int *= rMult;
    s.maxHp *= rMult; s.maxMp *= rMult;
    
    if (memberIndex === 0) {
        let essenceBonus = 0; player.equipped["정수"].forEach(ess => { essenceBonus += (ess.tier * 0.01); });
        if (essenceBonus > 0) {
            let mult = 1 + essenceBonus;
            s.atk *= mult; s.matk *= mult; s.def *= mult; s.maxHp *= mult; s.maxMp *= mult;
            s.str *= mult; s.dex *= mult; s.luk *= mult; s.int *= mult;
        }
        if (player.equipped['펫']) {
            let pet = player.equipped['펫'];
            if (pet.petEffect.type === '공격형') { let pM = 1 + pet.petEffect.value; s.atk *= pM; s.matk *= pM; }
            else if (pet.petEffect.type === '방어형') { let pM = 1 + pet.petEffect.value; s.def *= pM; }
        }
        if (player.fatigue >= 100) { s.atk *= 0.5; s.matk *= 0.5; s.def *= 0.5; }
    }
    return s;
}

function updateAllStats() {
    if(!player.party || player.party.length === 0) return;
    
    let hudHtml = '';
    player.party.forEach((member, idx) => {
        let s = member.isPlayer ? getTotalStats(0) : getTotalStats(idx);
        let hpRatio = Math.max(0, Math.min(100, (member.hp / s.maxHp) * 100)); let mpRatio = Math.max(0, Math.min(100, (member.mp / s.maxMp) * 100));
        let isDead = member.hp <= 0 ? ' (기절)' : '';
        let cp = getCombatPower(member, idx);
        
        hudHtml += `
            <div class="party-member" style="${member.hp <= 0 ? 'opacity:0.5;' : ''}">
                <div class="pm-header">
                    <img src="${member.img}" class="pm-char-icon">
                    <div class="pm-info">
                        <div class="pm-name">${idx === 0 ? '[L] ' : ''}${member.name||member.job} <span style="color:#ffc107;">(${member.rank}성)</span>${isDead}</div>
                        <div class="pm-sub">Lv.${member.level} ${member.job.split('(')[0]}</div>
                    </div>
                    <div class="pm-cp">CP ${f(cp)}</div>
                </div>
                <div class="stat-row"><span class="label">HP</span><div class="bar-bg"><div class="bar hp-bar" style="width:${hpRatio}%"></div></div><span class="value-text">${f(member.hp)}/${f(s.maxHp)}</span></div>
                <div class="stat-row"><span class="label">MP</span><div class="bar-bg"><div class="bar mp-bar" style="width:${mpRatio}%"></div></div><span class="value-text">${f(member.mp)}/${f(s.maxMp)}</span></div>
        `;
        if(idx === 0) {
            let hunRatio = Math.max(0, Math.min(100, (player.hunger / 100) * 100)); let fatRatio = Math.max(0, Math.min(100, (player.fatigue / 100) * 100));
            hudHtml += `
                <div class="stat-row"><span class="label" style="color:#fb8c00;">배고픔</span><div class="bar-bg"><div class="bar hunger-bar" style="width:${hunRatio}%"></div></div><span class="value-text">${player.hunger}</span></div>
                <div class="stat-row"><span class="label" style="color:${player.fatigue>=100?'#ff0000':'#8e24aa'};">피로도</span><div class="bar-bg"><div class="bar fatigue-bar" style="width:${fatRatio}%"></div></div><span class="value-text">${player.fatigue}</span></div>
            `;
        }
        hudHtml += `</div>`;
    });
    
    const hudArea = document.getElementById('hud-area'); 
    if(hudArea) { hudArea.style.gridTemplateColumns = player.party.length > 1 ? '1fr 1fr' : '1fr'; hudArea.innerHTML = hudHtml; }
    const expBar = document.getElementById('exp-bar'); if(expBar) expBar.style.width = `${(player.exp / player.maxExp) * 100}%`;
    const expText = document.getElementById('exp-text'); if(expText) expText.innerText = `Lv.${player.level} (${f(player.exp)}/${f(player.maxExp)})`;
    saveGame(); 
}

function levelUp() {
    player.level++; player.exp -= player.maxExp; player.maxExp = Math.floor(player.maxExp * 2.2); 
    player.party.forEach((p, idx) => {
        p.level = player.level;
        p.atk += 1; p.matk += 1; p.def += 1; p.str += 1; p.dex += 1; p.luk += 1; p.int += 1; 
        p.maxHp += 10; p.maxMp += 5;
        let s = getTotalStats(idx); p.hp = s.maxHp; p.mp = s.maxMp;
    });
    player.fatigue = 0; updateAllStats();
}

function passTime(days) {
    let oldMonth = player.month;
    for(let i=0; i<days; i++) { player.day++; player.orePrice = Math.floor(500 * (0.8 + Math.random() * 0.4)); }
    player.month = Math.floor((player.day - 1) / 30) % 12 + 1;
    player.year = Math.floor((player.day - 1) / 360) + 1;
    
    if (oldMonth !== player.month) {
        player.dungeonEnteredThisMonth = false; player.recruitUsedThisMonth = false; player.arenaEnteredThisMonth = false; player.academyUsedThisMonth = false; guildRecruit = null;
        
        player.monthsWithoutKill = (player.monthsWithoutKill || 0) + 1;
        if (player.monthsWithoutKill >= 6) {
            if (player.gold + (player.warehouse.gold || 0) < 1000) {
                player.gold = 0; player.warehouse.gold = 0; if(currentUser) db.collection("saves").doc(currentUser.uid).delete(); 
                fadeTransition(() => { showMessage(`[처형] 6개월간 몬스터 사냥을 하지 않아 벌금 1,000G가 청구되었습니다.<br>돈이 없어 <b>즉결 처형당했습니다...</b>`, () => { location.reload(); }); });
                return true;
            } else {
                let pTake = Math.min(player.gold, 1000); player.gold -= pTake;
                if (1000 > pTake) player.warehouse.gold -= (1000 - pTake);
                player.monthsWithoutKill = 0;
                showMessage(`[왕국 경고장]<br>6개월간 치안 유지에 기여하지 않아 벌금 1,000G가 징수되었습니다.`, renderTownUI);
                return true;
            }
        }

        let totalWealth = player.gold + (player.warehouse.gold || 0);
        let tax = 1000 + Math.floor(totalWealth * 0.1); 
        
        if (totalWealth < tax) {
            player.gold = 0; player.warehouse.gold = 0; if(currentUser) db.collection("saves").doc(currentUser.uid).delete(); 
            fadeTransition(() => { showMessage(`[처형] 왕가의 세금 ${f(tax)}G를 납부하지 못했습니다.<br>반역죄로 처형당했습니다...`, () => { location.reload(); }); });
            return true;
        }
        
        let pTake = Math.min(player.gold, tax); player.gold -= pTake;
        if (tax > pTake) player.warehouse.gold -= (tax - pTake);
        
        showMessage(`[${player.year}년 ${player.month}월]<br><br>새로운 달이 밝았습니다!<br>왕가의 보호비 명목으로 ${f(tax)}G가 징수되었습니다.`, renderTownUI);
        return true;
    }
    return false;
}

function showClassSelection() {
    const cg = document.getElementById('class-grid');
    cg.innerHTML = Object.keys(baseClasses).map(k => `
        <div class="class-card" onclick="promptSubClass('${k}')">
            <div class="class-sprite"><img src="${baseClasses[k].img}" class="class-img"></div>
            <div class="class-info"><div class="class-name">${k}</div><div class="class-desc">${baseClasses[k].desc}</div></div>
        </div>
    `).join('');
    fadeTransition(() => { document.getElementById('creation-screen').classList.remove('hidden'); });
}

function promptSubClass(baseJob) {
    if(baseJob === '바바리안') showMessage("바바리안 특성을 선택하세요.", null, [{txt: "탱커", act: "promptNickname('바바리안(탱커)')"}, {txt: "브루저", act: "promptNickname('바바리안(브루저)')"}, {txt: "광전사", act: "promptNickname('바바리안(광전사)')"}]);
    else if(baseJob === '마법사') showMessage("마법사 특성을 선택하세요.", null, [{txt: "전투마법", act: "promptNickname('마법사(전투마법)')"}, {txt: "회복마법", act: "promptNickname('마법사(회복마법)')"}]);
    else promptNickname(baseJob); 
}

function promptNickname(job) { showMessage(`[캐릭터 생성]<br>선택한 직업: <b>${job}</b><br><br>사용할 닉네임을 입력해주세요:<br><input type="text" id="nickname-input" value="모험가" style="width:100%; padding:8px; margin-top:8px; background:#222; border:1px solid #444; color:#fff; border-radius:4px;">`, null, [{txt: "결정", act: "confirmNickname('" + job + "')"}]); }
function confirmNickname(job) { let input = document.getElementById('nickname-input'); let nickname = input ? input.value.trim() : "모험가"; if(!nickname) nickname = "모험가"; closeModal(); selectClass(job, nickname); }

function selectClass(job, nickname) {
    let d = jobData[job]; let mainChar = { isPlayer: true, name: nickname, job: job, rank: 1, level: 1, hp: d.maxHp, mp: d.maxMp, img: d.img, ...d };
    player.party.push(mainChar); player.migratedEquip = true;
    fadeTransition(() => {
        document.getElementById('creation-screen').classList.add('hidden'); document.getElementById('main-screen').classList.remove('hidden'); updateAllStats();
        showMessage(`<div style="font-weight:bold; color:#ffd54f; font-size:15px; margin-bottom:12px; text-align:center;">[ 던전 서바이버 환영합니다 ]</div><b style="color:#e53935">1. 왕가의 세금 (주의!)</b><br>매월 1일, 1,000G + 전 재산의 10% 납부. 못 내면 처형!<br><br><b style="color:#00e5ff">2. 마을 시설</b><br>- 길드, 투기장, 병원, 창고 등을 이용해 성장하세요.<br><br><b style="color:#ce93d8">3. 던전 규칙</b><br>던전 입장 시 팝업 가이드가 제공됩니다.`, renderTownUI);
    });
}

function showDungeonGuide() {
    showMessage(`<div style="font-weight:bold; color:#ffd54f; font-size:15px; margin-bottom:12px; text-align:center;">[ 던전 가이드 ]</div>⚔️ <b>행동력 (턴)</b>: 전진할 때마다 1턴 소모. 밤(20턴)이 되면 자야 합니다.<br><br>🍖 <b>허기와 피로도</b>: 허기가 0일 때 잠을 자면 피로도가 크게 상승합니다! <b>피로도가 100이 되면 공격/방어력이 반토막 나며, 이동 시 매 턴 5%의 체력을 잃습니다.</b><br><br>💀 <b>사망 페널티</b>: 파티장이 기절하면 소모품 전부와 골드 절반을 잃습니다.<br><br>🛡️ <b>모험가의 본분</b>: 6개월 동안 몬스터를 1마리도 처치하지 않으면 벌금 1,000G 청구 및 처형 위험이 있습니다.<br><br>💰 <b>주민 후원</b>: 사냥한 몬스터 5마리 단위로 귀환 시 마을 주민들이 후원금을 줍니다.`);
}

// 💡 1. 가독성 패치 (scene-box 래핑 변경)
function showTownMenu() {
    player.inDungeon = false; isAutoCombat = false; updateDungeonTimer(); 
    setBackground('town');
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    document.getElementById('equip-ui-overlay').classList.add('hidden');
    
    let isNYEvent = player.month === 1 && !player.eventClaimed[`ny_${player.year}`];
    let evClass = isNYEvent || true ? 'event-blink' : '';

    if(sceneText) sceneText.innerHTML = `
        ${getPlayerSprite(120)}
        <div class="scene-box">
            [마을 - ${player.year}년 ${player.month}월 ${((player.day - 1) % 30) + 1}일]<br>소지금: ${f(player.gold)}G | 위상: ${f(player.prestige)}
        </div>
    `;
    
    if(actionArea) {
        actionArea.innerHTML = `
            <div class="action-grid">
                <div class="icon-btn" onclick="fadeTransition(tryEnterDungeon)">${icons.dungeon}<span>던전</span></div>
                <div class="icon-btn" onclick="openArena()">${icons.arena}<span>투기장</span></div>
                <div class="icon-btn" onclick="fadeTransition(openWorkplace)">${icons.work}<span>일터 (알바)</span></div>
                <div class="icon-btn" onclick="fadeTransition(openShop)">${icons.shop}<span>상점</span></div>
                <div class="icon-btn" onclick="fadeTransition(openGuild)">${icons.guild}<span>길드</span></div>
                <div class="icon-btn" onclick="fadeTransition(openHospital)">${icons.hospital}<span>병원</span></div>
                <div class="icon-btn" onclick="fadeTransition(openWarehouse)">${icons.warehouse}<span>창고</span></div>
                <div class="icon-btn ${evClass}" onclick="openEventTab()">${icons.event}<span>이벤트</span></div>
            </div>
            <div class="action-grid" style="grid-template-columns:1fr; margin-top:8px;">
                <div class="icon-btn" style="border-color:#555;" onclick="fadeTransition(() => openInventory('town'))">${icons.bag}<span>가방 / 장비</span></div>
            </div>
        `;
    }
}

function openEventTab() {
    setBackground('town');
    let isNYEvent = player.month === 1 && !player.eventClaimed[`ny_${player.year}`];
    let html = `<div style="text-align:center; margin-bottom:15px; font-weight:bold; color:#ff9800;">[ 진행 중인 이벤트 ]</div>`;
    
    if (isNYEvent) {
        html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">🎊 새해 축하 이벤트 (${player.year}년)</div><button class="btn inv-btn" style="border-color:#ff9800; color:#ff9800;" onclick="claimNYEvent()">보상 받기</button></div><div class="inv-stats">새해 복 많이 받으세요! 왕국에서 특별한 봉투를 드립니다.</div></div>`;
    } 
    html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">🐾 상시 펫 소환 이벤트</div><button class="btn inv-btn" style="border-color:#4caf50; color:#4caf50;" onclick="summonPet()">5,000G 소환</button></div><div class="inv-stats">확률에 따라 펫 상자를 획득합니다. (가방에서 개봉)</div></div>`;
    
    html += `<button class="btn" style="margin-top:12px; width:100%" onclick="renderTownUI()">돌아가기</button>`;
    document.getElementById('action-area').innerHTML = html;
    document.getElementById('scene-text').innerHTML = `${getPlayerSprite(70)}<div class="scene-box">[이벤트 게시판]</div>`;
}

function claimNYEvent() {
    player.eventClaimed[`ny_${player.year}`] = true; player.items.envelope = (player.items.envelope || 0) + 1; saveGame();
    showMessage("새해 축하 봉투를 받았습니다!<br>가방에서 사용할 수 있습니다.", openEventTab);
}

function summonPet() {
    if (player.gold < 5000) return showMessage("골드가 부족합니다.");
    player.gold -= 5000; player.items.petBox = (player.items.petBox || 0) + 1; saveGame();
    showMessage("🐾 펫 상자를 획득했습니다!<br>가방에서 열어보세요.", openEventTab);
}

function renderTownUI() { updateAllStats(); showTownMenu(); }

function generateArenaFighter(tier) {
    let jobs = Object.keys(jobData).filter(j => !j.includes('회복')); 
    let job = jobs[Math.floor(Math.random() * jobs.length)]; let d = jobData[job]; 
    let pLv = player.level; let rMult = Math.pow(3, tier - 1);
    
    let hp = (d.maxHp + pLv * 10) * rMult;
    let mp = (d.maxMp + pLv * 5) * rMult;
    
    return {
        isPlayer: false, isArena: true, name: namePool[Math.floor(Math.random() * namePool.length)], job: job, tier: tier, img: d.img, 
        maxHp: hp, hp: hp, maxMp: mp, mp: mp, 
        atk: (d.atk + pLv) * rMult, matk: (d.matk + pLv) * rMult, def: (d.def + pLv) * rMult, 
        str: (d.str + pLv) * rMult, dex: (d.dex + pLv) * rMult, luk: (d.luk + pLv) * rMult, int: (d.int + pLv) * rMult,
        skills: d.skills
    };
}

function openArena() {
    if(player.arenaEnteredThisMonth) return showMessage("이번 달 투기장 대회는 이미 참가하셨습니다.");
    showMessage(`[ 투기장 토너먼트 ]<br>매월 1회 참가 가능 (참가비 100G).<br>16인의 모험가가 무작위 대진표로 겨룹니다!<br><br>※ 오직 파티장 1인만 전투에 참여합니다.<br>※ 전투 중 포션 사용 불가<br>※ 매 경기 종료 후 체력/마나 전부 회복`, null, [{txt: "참가 (100G)", act: "startArena()"}, {txt: "취소", act: "closeModal()"}]);
}

function startArena() {
    closeModal(); if(player.gold < 100) return showMessage("골드가 부족합니다."); player.gold -= 100; player.arenaEnteredThisMonth = true; saveGame();
    
    let fighters = [{ ...player.party[0], isRealPlayer: true, tier: player.rank }];
    while(fighters.length < 16) { let t = Math.max(1, player.rank + Math.floor(Math.random() * 7) - 3); fighters.push(generateArenaFighter(t)); }
    fighters.sort(() => 0.5 - Math.random()); arenaState = { round: 16, fighters: fighters }; showBracketUI();
}

function showBracketUI() {
    let html = `<div style="text-align:center; font-weight:bold; color:#ffc107; font-size:15px; margin-bottom:12px;">[ ${arenaState.round === 2 ? '결승전' : `${arenaState.round}강 대진표`} ]</div>`;
    html += `<div style="display:flex; flex-direction:column; gap:6px; max-height:300px; overflow-y:auto; font-size:11px; padding-right:5px; margin-bottom:10px;">`;
    
    for(let i=0; i<arenaState.fighters.length; i+=2) {
        let f1 = arenaState.fighters[i]; let f2 = arenaState.fighters[i+1];
        let p1n = f1.isRealPlayer ? `<span style="color:#4caf50; font-weight:bold;">(나) ${f1.name}</span>` : `[${f1.tier}성] ${f1.name}`;
        let p2n = f2.isRealPlayer ? `<span style="color:#4caf50; font-weight:bold;">(나) ${f2.name}</span>` : `[${f2.tier}성] ${f2.name}`;
        let isMyMatch = f1.isRealPlayer || f2.isRealPlayer;
        html += `<div style="background:#1a1a1a; padding:10px; border:${isMyMatch?'1px solid #4caf50':'1px solid #333'}; border-radius:6px; display:flex; justify-content:space-between; align-items:center;"><div style="width:40%; text-align:right;">${p1n}</div><div style="width:20%; text-align:center; color:#e53935; font-weight:bold;">VS</div><div style="width:40%; text-align:left;">${p2n}</div></div>`;
    }
    html += `</div>`;
    showMessage(html, null, [{txt: "내 경기 시작", act: "startArenaMatch()"}]);
}

function startArenaMatch() {
    closeModal();
    let pIdx = arenaState.fighters.findIndex(f => f.isRealPlayer); currentEnemy = (pIdx % 2 === 0) ? arenaState.fighters[pIdx + 1] : arenaState.fighters[pIdx - 1];
    let ts = getTotalStats(0); player.party[0].hp = ts.maxHp; player.party[0].mp = ts.maxMp; updateAllStats();
    let rText = arenaState.round === 2 ? "결승전" : `${arenaState.round}강전`; combatState.turnIndex = 0; document.getElementById('dungeon-bg').classList.remove('hidden'); renderCombatTurn(`투기장 ${rText}이 시작되었습니다!`, false);
}

function openWorkplace() {
    setBackground('town');
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    let daysToWork = 30 - (((player.day - 1) % 30) + 1) + 1;
    sceneText.innerHTML = `${getPlayerSprite(70)}<div class="scene-box">[일터]<br>현재 달의 남은 일수: ${daysToWork}일<br>근무 시 말일까지 연속으로 일합니다 (일당 50G).</div>`;
    let html = `<div style="display:flex; flex-direction:column; gap:8px;">`;
    ["식당", "대장간", "약국"].forEach(w => {
        let prof = player.proficiencies[w].toFixed(1);
        html += `<button class="btn" onclick="${prof >= 100 ? `showMessage('사업장 건축 기능은 준비 중입니다.')` : `doWork('${w}', ${daysToWork})`}">${prof >= 100 ? `${w} 운영 (준비중)` : `${w} 알바 (숙련도: ${prof})`}</button>`;
    });
    html += `</div><button class="btn" style="margin-top:12px; width:100%;" onclick="fadeTransition(renderTownUI)">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function doWork(place, days) { fadeTransition(() => { let earned = days * 50; player.gold += earned; player.proficiencies[place] += (days * 0.1); if(passTime(days)) return; updateAllStats(); showMessage(`${days}일 동안 ${place}에서 알바하여 ${f(earned)}G를 벌었습니다.`, renderTownUI); }); }

function openHospital() {
    setBackground('town');
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `${getPlayerSprite(70)}<div class="scene-box">[병원]<br>기절한 동료를 치료합니다.<br>비용: (동료의 레벨 x 200G)</div>`;
    let html = `<div style="display:flex; flex-direction:column; gap:8px;">`; let hasDead = false;
    for(let i=1; i<player.party.length; i++) { let p = player.party[i]; if (p.hp <= 0) { hasDead = true; html += `<button class="btn" style="border-color:#e53935;" onclick="healCompanion(${i}, ${p.level * 200})">${p.name} 치료 (${f(p.level * 200)}G)</button>`; } }
    if(!hasDead) html += `<div style="color:#aaa; text-align:center; padding:10px;">치료가 필요한 동료가 없습니다.</div>`;
    html += `</div><button class="btn" style="margin-top:12px; width:100%;" onclick="fadeTransition(renderTownUI)">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function healCompanion(index, cost) { if(player.gold < cost) return showMessage(`치료비(${f(cost)}G)가 부족합니다.`); player.gold -= cost; let s = getTotalStats(index); player.party[index].hp = s.maxHp; updateAllStats(); showMessage(`${player.party[index].name}의 치료가 완료되었습니다.`, openHospital); }

function openGuild() {
    setBackground('guild');
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `${getPlayerSprite(120)}<div class="scene-box">[용병 길드]<br>최대 4인 구성, 중복 직업 불가.</div>`;
    actionArea.innerHTML = `
        <div class="action-grid" style="grid-template-columns: 1fr 1fr;">
            <div class="icon-btn" onclick="showRecruit()">${icons.guild}<span>동료 섭외</span></div>
            <div class="icon-btn" onclick="showDismiss()">${icons.run}<span>동료 방출</span></div>
            <div class="icon-btn" style="border-color:#00e5ff;" onclick="openAcademy()">🏰<br><span>전투 아카데미</span></div>
            <div class="icon-btn" style="border-color:#ffc107;" onclick="checkPromotion()">${icons.attack}<span style="color:#ffc107;">승급 퀘스트</span></div>
        </div>
        <div class="action-grid" style="grid-template-columns: 1fr; margin-top:8px;">
            <div class="icon-btn" style="border-color:#555;" onclick="fadeTransition(renderTownUI)">${icons.home}<span>돌아가기</span></div>
        </div>
    `;
}

function openAcademy() {
    if (player.rank > 1) return showMessage("1등급 모험가 전용 시설입니다.<br>고등급 모험가는 출입할 수 없습니다.");
    if (player.academyUsedThisMonth) return showMessage("이번 달 훈련은 이미 수강하셨습니다.");
    showMessage("전투 아카데미에 오신 것을 환영합니다.<br>기초 훈련을 통해 주요 스탯을 소폭 상승시킵니다.<br>(월 1회, 100G 소모)", null, [
        {txt: "훈련하기 (100G)", act: "doAcademy()"}, {txt: "취소", act: "closeModal()"}
    ]);
}

function doAcademy() {
    if(player.gold < 100) return showMessage("골드가 부족합니다.");
    player.gold -= 100; player.academyUsedThisMonth = true;
    player.party[0].str += 1; player.party[0].dex += 1; player.party[0].int += 1; player.party[0].luk += 1;
    updateAllStats(); showMessage("훈련을 무사히 마쳤습니다!<br>파티장의 주요 스탯(힘,민첩,지능,행운)이 +1씩 영구 상승했습니다.", openGuild);
}

function checkPromotion() {
    let n = player.rank + 1; let mReq = n * 10; let pReq = n * 100; let mCount = player.mobKills[n] || 0;
    if(mCount >= mReq && player.prestige >= pReq) {
        player.rank++; player.prestige += 10; showMessage(`🎉 <b>${player.rank}등급으로 승급했습니다!</b> 🎉<br>위상 +10 획득! 새로운 스킬이 개방되었습니다.`, openGuild); saveGame();
    } else showMessage(`[${n}등급 승급 조건]<br>${mCount>=mReq?'✅':'❌'} ${n}층 몬스터 처치 ( ${mCount} / ${mReq} )<br>${player.prestige>=pReq?'✅':'❌'} 위상 달성 ( ${f(player.prestige)} / ${f(pReq)} )<br><br><span style="font-size:11px; color:#aaa;">※ 위상은 승급 및 투기장 성적으로 얻습니다.</span>`);
}

function showRecruit() {
    if (player.recruitUsedThisMonth) return showMessage("이번 달 길드 영입은 이미 마감되었습니다.");
    if (player.party.length >= 4) return showMessage("파티가 이미 4명으로 가득 찼습니다.");
    
    if (!guildRecruit) {
        if (Math.random() < 0.3) { player.recruitUsedThisMonth = true; return showMessage("오늘은 길드에 쓸만한 인재가 보이지 않습니다."); }
        let availableJobs = Object.keys(jobData).filter(j => !player.party.some(p => p.job === j));
        if(availableJobs.length === 0) return showMessage("더 이상 영입할 수 있는 직업이 없습니다.");
        
        let jName = availableJobs[Math.floor(Math.random() * availableJobs.length)]; let d = jobData[jName];
        let rnk = Math.floor(Math.random() * player.rank) + 1;
        guildRecruit = { isPlayer: false, name: namePool[Math.floor(Math.random() * namePool.length)], job: jName, rank: rnk, level: player.level, img: d.img, hp: d.maxHp + (player.level*10), mp: d.maxMp + (player.level*5), maxHp: d.maxHp + (player.level*10), maxMp: d.maxMp + (player.level*5), atk: d.atk + (player.level*1), def: d.def + (player.level*1), matk: d.matk + (player.level*1), str: d.str + (player.level*1), dex: d.dex + (player.level*1), luk: d.luk + (player.level*1), int: d.int + (player.level*1), skills: d.skills };
    }
    
    let cost = guildRecruit.rank * 10000;
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; margin: 0 auto 10px auto; width: 70px; height: 70px;"><img src="${jobData[guildRecruit.job].img}" class="player-img"></div><div class="scene-box">[용병 영입]<br>${guildRecruit.rank}성 모험가 <b>${guildRecruit.name}</b> (Lv.${guildRecruit.level}, ${guildRecruit.job}) 가 파티 합류를 원합니다.<br><span style="color:#ffc107;">영입 비용: ${f(cost)}G</span></div>`;
    actionArea.innerHTML = `<div class="action-grid" style="grid-template-columns: 1fr;"><button class="btn" style="border-color:#4caf50;" onclick="acceptRecruit(${cost})">영입하기</button><button class="btn" onclick="openGuild()">거절 (돌아가기)</button></div>`;
}

function acceptRecruit(cost) { 
    if(player.gold < cost) return showMessage("영입 비용이 부족합니다.");
    player.gold -= cost; player.party.push(guildRecruit); player.recruitUsedThisMonth = true; guildRecruit = null; updateAllStats(); showMessage("새로운 동료가 파티에 합류했습니다!", openGuild); 
}

function showDismiss() {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `${getPlayerSprite(70)}<div class="scene-box">[동료 방출]<br>위로금 5,000G가 필요합니다.</div>`;
    let html = `<div style="display:flex; flex-direction:column; gap:8px;">`;
    for(let i=1; i<player.party.length; i++) html += `<button class="btn" style="border-color:#e53935;" onclick="dismissCompanion(${i})">${player.party[i].name} 방출 (5,000G)</button>`;
    html += `</div><button class="btn" style="margin-top:12px; width:100%;" onclick="openGuild()">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function dismissCompanion(index) { if (player.gold < 5000) return showMessage("위로금이 부족하여 방출할 수 없습니다."); player.gold -= 5000; player.party.splice(index, 1); updateAllStats(); showMessage("위로금을 지급하고 동료를 방출했습니다.", showDismiss); }

function openShop() {
    setBackground('town');
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `${getPlayerSprite(70)}<div class="scene-box">[상점]<br>소지금: ${f(player.gold)}G<br>오늘의 원석 시세: ${f(player.orePrice)}G/개</div>`;
    let html = `<div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto;">`;
    
    html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.food} 식량 (500G) - 보유: ${f(player.items.food)}개</div><button class="btn inv-btn" onclick="buyItem('food')">구매</button></div></div>`;
    html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.hp} HP포션 (500G) - 보유: ${f(player.items.hpPotion)}개</div><button class="btn inv-btn" onclick="buyItem('hpPotion')">구매</button></div></div>`;
    html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.mp} MP포션 (500G) - 보유: ${f(player.items.mpPotion)}개</div><button class="btn inv-btn" onclick="buyItem('mpPotion')">구매</button></div></div>`;
    html += `<div class="inv-item"><div class="inv-header"><div class="inv-info" style="color:#00e5ff;">${icons.ore} 원석 (${f(player.items.ore)}개 보유)</div><button class="btn inv-btn" style="border-color:#00e5ff; color:#00e5ff;" onclick="sellOre()">전부 판매</button></div></div>`;
    
    player.essenceList.forEach((ess, idx) => { let sellPrice = 1000 * Math.pow(3, ess.tier - 1); html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.ore} <span style="color:#ce93d8;">[정수] ${ess.name}</span></div><button class="btn inv-btn" style="border-color:#ce93d8; color:#ce93d8;" onclick="sellEssence(${idx}, ${sellPrice})">판매 (${f(sellPrice)}G)</button></div></div>`; });
    player.equipList.forEach((eq, idx) => { let sellPrice = eq.type === '펫' ? eq.tier * 1000 : eq.tier * 200; html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.equip} <span style="color:#ffd54f;">[${eq.type}] ${eq.name}</span></div><button class="btn inv-btn" style="border-color:#ffd54f; color:#ffd54f;" onclick="sellEquip(${idx}, ${sellPrice})">판매 (${f(sellPrice)}G)</button></div></div>`; });
    
    html += `</div><button class="btn" style="margin-top:12px; width:100%;" onclick="fadeTransition(renderTownUI)">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function buyItem(type) { if(player.gold < 500) return showMessage("골드가 부족합니다."); player.gold -= 500; player.items[type]++; updateAllStats(); openShop(); }
function sellOre() { if(player.items.ore <= 0) return showMessage("판매할 원석이 없습니다."); let total = Math.floor(player.items.ore * player.orePrice); player.gold += total; player.items.ore = 0; updateAllStats(); showMessage(`원석을 모두 팔아 ${f(total)}G를 얻었습니다.`, openShop); }
function sellEssence(index, price) { player.gold += price; player.essenceList.splice(index, 1); updateAllStats(); openShop(); }
function sellEquip(index, price) { player.gold += price; player.equipList.splice(index, 1); updateAllStats(); openShop(); }

function openWarehouse() {
    setBackground('town');
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `${getPlayerSprite(70)}<div class="scene-box">[마을 창고]<br>골드와 아이템을 안전하게 보관합니다.</div>`;
    
    let html = `<div style="text-align:center; color:#ffd54f; font-weight:bold; margin-bottom:10px; font-size:12px;">소지금: ${f(player.gold)}G / 창고: ${f(player.warehouse.gold || 0)}G</div>`;
    html += `<div class="action-grid" style="grid-template-columns:1fr 1fr; margin-bottom:15px;">
                <button class="btn" style="padding:10px;" onclick="transferGold('store', 1000)">1,000G 입금</button>
                <button class="btn" style="padding:10px;" onclick="transferGold('store', 'all')">전액 입금</button>
                <button class="btn" style="padding:10px;" onclick="transferGold('retrieve', 1000)">1,000G 출금</button>
                <button class="btn" style="padding:10px;" onclick="transferGold('retrieve', 'all')">전액 출금</button>
             </div>`;
    
    html += `<div style="display:flex; flex-direction:column; gap:12px; max-height: 180px; overflow-y:auto; padding-right:5px;">`;
    html += `<div style="color:#00e5ff; font-weight:bold; font-size:12px;">[ 내 가방 -> 창고 보관 ]</div>`;
    ['food', 'hpPotion', 'mpPotion', 'ore', 'petBox'].forEach(t => {
        if(player.items[t] > 0) { let name = t==='food'?'식량':t==='hpPotion'?'HP포션':t==='mpPotion'?'MP포션':t==='petBox'?'펫 상자':'원석'; html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${name} (${f(player.items[t])}개 보유)</div><button class="btn inv-btn" onclick="transferItem('store', '${t}')">1개 보관</button></div></div>`; }
    });
    player.equipList.forEach((eq, idx) => { html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">[${eq.type}] ${eq.name}</div><button class="btn inv-btn" onclick="transferEquip('store', ${idx})">보관</button></div></div>`; });
    player.essenceList.forEach((ess, idx) => { html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">[정수] ${ess.name}</div><button class="btn inv-btn" onclick="transferEssence('store', ${idx})">보관</button></div></div>`; });

    html += `<div style="color:#ffd54f; font-weight:bold; font-size:12px; margin-top:10px;">[ 창고 -> 내 가방 꺼내기 ]</div>`;
    ['food', 'hpPotion', 'mpPotion', 'ore', 'petBox'].forEach(t => {
        if(player.warehouse.items[t] > 0) { let name = t==='food'?'식량':t==='hpPotion'?'HP포션':t==='mpPotion'?'MP포션':t==='petBox'?'펫 상자':'원석'; html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${name} (${f(player.warehouse.items[t])}개 보관중)</div><button class="btn inv-btn" onclick="transferItem('retrieve', '${t}')">1개 꺼내기</button></div></div>`; }
    });
    player.warehouse.equipList.forEach((eq, idx) => { html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">[${eq.type}] ${eq.name}</div><button class="btn inv-btn" onclick="transferEquip('retrieve', ${idx})">꺼내기</button></div></div>`; });
    player.warehouse.essenceList.forEach((ess, idx) => { html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">[정수] ${ess.name}</div><button class="btn inv-btn" onclick="transferEssence('retrieve', ${idx})">꺼내기</button></div></div>`; });

    html += `</div><button class="btn" style="margin-top:12px; width:100%" onclick="renderTownUI()">돌아가기</button>`;
    actionArea.innerHTML = html;
}

function transferGold(action, amount) {
    if(action === 'store') {
        let amt = amount === 'all' ? player.gold : Math.min(amount, player.gold);
        if(amt <= 0) return showMessage("보관할 골드가 없습니다.");
        player.gold -= amt; player.warehouse.gold += amt;
    } else {
        let amt = amount === 'all' ? player.warehouse.gold : Math.min(amount, player.warehouse.gold);
        if(amt <= 0) return showMessage("꺼낼 골드가 없습니다.");
        player.warehouse.gold -= amt; player.gold += amt;
    }
    saveGame(); updateAllStats(); openWarehouse();
}

function transferItem(action, type) { if (action === 'store' && player.items[type] > 0) { player.items[type]--; player.warehouse.items[type]++; } else if (action === 'retrieve' && player.warehouse.items[type] > 0) { player.warehouse.items[type]--; player.items[type]++; } saveGame(); openWarehouse(); }
function transferEquip(action, idx) { if (action === 'store') player.warehouse.equipList.push(player.equipList.splice(idx, 1)[0]); else if (action === 'retrieve') player.equipList.push(player.warehouse.equipList.splice(idx, 1)[0]); saveGame(); openWarehouse(); }
function transferEssence(action, idx) { if (action === 'store') player.warehouse.essenceList.push(player.essenceList.splice(idx, 1)[0]); else if (action === 'retrieve') player.essenceList.push(player.warehouse.essenceList.splice(idx, 1)[0]); saveGame(); openWarehouse(); }

function tryEnterDungeon() { if (player.day > 1 && player.dungeonEnteredThisMonth) return showMessage(`이번 달 던전 입장은 마쳤습니다.`); startDungeonExpedition(); }

function generateFloor() {
    player.pos = {x: 1, y: 1}; player.visited = ['1,1']; player.targetPos = null; player.stepsLeft = 0;
    let bx, by; do { bx = Math.floor(Math.random() * 3); by = Math.floor(Math.random() * 3); } while(bx===1 && by===1); player.bossPos = {x: bx, y: by};
    let mx, my; do { mx = Math.floor(Math.random() * 3); my = Math.floor(Math.random() * 3); } while((mx===1 && my===1) || (mx===bx && my===by)); player.monumentPos = {x: mx, y: my}; player.monumentFound = false;
}

function startDungeonExpedition() {
    player.dungeonEnteredThisMonth = true; player.inDungeon = true; isAutoCombat = false;
    player.dungeonDay = 1; player.maxDungeonDay = 7; player.turn = 0; player.dungeonKills = 0; player.hunger = 0;
    generateFloor(); 
    if (!player.dungeonGuideSeen) { player.dungeonGuideSeen = true; showDungeonGuide(); }
    updateDungeonTimer(); document.getElementById('dungeon-bg').classList.remove('hidden'); renderDungeonUI();
}

function updateDungeonTimer() {
    const tHud = document.getElementById('dungeon-time-hud'); const rHud = document.getElementById('dungeon-turn-hud'); const kHud = document.getElementById('dungeon-kill-hud'); const gBtn = document.getElementById('guide-btn');
    if(!tHud) return;
    if (player.inDungeon && !currentEnemy) {
        tHud.classList.remove('hidden'); rHud.classList.remove('hidden'); kHud.classList.remove('hidden'); gBtn.classList.remove('hidden');
        document.getElementById('dt-turn-text').innerText = `남은 턴: ${player.maxTurn - player.turn} / ${player.maxTurn}`;
        document.getElementById('dt-kill-text').innerText = `⚔️ 처치: ${f(player.dungeonKills || 0)}`;
        let dLeft = player.maxDungeonDay + 1 - player.dungeonDay;
        document.getElementById('dt-text').innerText = `남은 기간: ${dLeft}일`;
        document.getElementById('dt-bar').style.width = `${(dLeft / player.maxDungeonDay) * 100}%`;
        setBackground('dungeon');
    } else { tHud.classList.add('hidden'); rHud.classList.add('hidden'); kHud.classList.add('hidden'); gBtn.classList.add('hidden'); }
}

function getMinimapHTML() {
    let html = '<div id="minimap-wrapper"><div class="minimap">';
    for(let y=0; y<3; y++) {
        for(let x=0; x<3; x++) {
            let classes = 'mm-cell';
            let isCurrent = (player.stepsLeft > 0 && player.targetPos) ? (player.targetPos.x === x && player.targetPos.y === y) : (player.pos.x === x && player.pos.y === y);
            
            if(isCurrent) classes += ' mm-current';
            else if(player.monumentFound && player.monumentPos && player.monumentPos.x === x && player.monumentPos.y === y) classes += ' mm-monument';
            else if(player.visited.includes(`${x},${y}`)) classes += ' mm-visited';
            html += `<div class="${classes}"></div>`;
        }
    }
    html += '</div></div>'; return html;
}

function renderDungeonUI() {
    updateDungeonTimer(); document.getElementById('equip-ui-overlay').classList.add('hidden'); setBackground('dungeon');
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    
    if (player.turn >= player.maxTurn) {
        sceneText.innerHTML = `<div class="scene-box">${getMinimapHTML()}[밤]<br>너무 어두워 잠을 청해야만 합니다.</div>`;
        actionArea.innerHTML = `<div class="action-grid" style="grid-template-columns:1fr;"><div class="icon-btn" style="border-color:#4a148c; padding:24px;" onclick="showSleepMenu()"><span style="font-size:14px;">잠자기</span></div></div>`;
        return;
    }
    
    if (player.stepsLeft > 0) {
        sceneText.innerHTML = `<div class="scene-box">${getMinimapHTML()}[이동 중]<br>남은 거리: ${player.stepsLeft}보<br>남은 턴: ${player.maxTurn - player.turn} / 20</div>`;
        actionArea.innerHTML = `
            <div class="action-grid" style="grid-template-columns:1fr;">
                <div class="icon-btn" style="border-color:#888; padding:24px;" onclick="stepForward()"><span style="font-size:14px;">전진 (1턴 소모)</span></div>
            </div>
            <div class="action-grid" style="grid-template-columns:1fr 1fr; margin-top:8px;">
                <div class="icon-btn" onclick="openInventory('dungeon')">${icons.bag}<span>가방 / 장비</span></div>
                <div class="icon-btn" style="border-color:#4a148c;" onclick="showSleepMenu()">${icons.sleep}<span>잠자기</span></div>
            </div>
        `;
        return;
    }
    
    let currentName = mapGrid[player.pos.y][player.pos.x].n;
    sceneText.innerHTML = `<div class="scene-box">${getMinimapHTML()}[${player.floor}층 - ${currentName} 구역]<br><span style="font-size:11px; color:#aaa;">※ 방향을 눌러 인접한 구역으로 5칸 이동합니다.</span></div>`;

    let gridHtml = '<div class="compass-grid">';
    for(let y=0; y<3; y++) {
        for(let x=0; x<3; x++) {
            let isCurr = (player.pos.x === x && player.pos.y === y);
            let isAdj = Math.abs(x - player.pos.x) <= 1 && Math.abs(y - player.pos.y) <= 1 && !isCurr;
            if (isCurr) gridHtml += `<div class="compass-empty compass-current">현재구역</div>`;
            else if (isAdj) gridHtml += `<button class="compass-btn" onclick="startJourney(${x},${y})"><span>${mapGrid[y][x].n}</span></button>`;
            else gridHtml += `<div class="compass-empty">이동불가</div>`;
        }
    }
    gridHtml += `</div>`;
    
    if (player.monumentFound && player.pos.x === player.monumentPos.x && player.pos.y === player.monumentPos.y) {
        gridHtml += `<div class="action-grid" style="grid-template-columns:1fr; margin-top:12px;"><div class="icon-btn" style="border-color:#00e5ff; color:#00e5ff;" onclick="goNextFloor()">${icons.monument}<span>다음 층으로 올라가기</span></div></div>`;
    }

    gridHtml += `<div class="action-grid" style="grid-template-columns:1fr 1fr; margin-top:12px;"><div class="icon-btn" onclick="openInventory('dungeon')">${icons.bag}<span>가방 / 장비</span></div><div class="icon-btn" style="border-color:#4a148c;" onclick="showSleepMenu()">${icons.sleep}<span>잠자기</span></div></div>`;
    actionArea.innerHTML = gridHtml;
}

function showSleepMenu() { showMessage("어떻게 주무시겠습니까?", null, [{txt: "하룻밤 자기 (턴 초기화)", act: "closeModal(); sleepInDungeon(false)"}, {txt: "던전 닫힐 때까지 푹 자기 (마을 복귀)", act: "closeModal(); sleepInDungeon(true)"}, {txt: "취소", act: "closeModal()"}]); }

function sleepInDungeon(sleepUntilClose) {
    if (sleepUntilClose) { let daysLeft = player.maxDungeonDay + 1 - player.dungeonDay; passTime(daysLeft); return fadeTransition(() => { returnToTown(false); }); }
    
    if (player.hunger <= 0) player.fatigue = Math.min(100, player.fatigue + 30);
    else if (player.hunger >= 100) player.fatigue = Math.max(0, player.fatigue - 50);
    else player.fatigue = Math.max(0, player.fatigue - 20); 
    
    player.party.forEach((p, i) => {
        let s = p.isPlayer ? getTotalStats(0) : getTotalStats(i);
        if(p.hp > 0) { p.hp = Math.min(s.maxHp, p.hp + Math.floor(s.maxHp * 0.3)); p.mp = Math.min(s.maxMp, p.mp + Math.floor(s.maxMp * 0.3)); }
    });

    player.turn = 0; player.hunger = 0; player.dungeonDay++; passTime(1); updateAllStats(); 
    if (player.dungeonDay > player.maxDungeonDay) fadeTransition(() => { returnToTown(false); }); else renderDungeonUI();
}

function applyPetRecovery() {
    if (player.equipped['펫'] && player.equipped['펫'].petEffect.type === '회복형') {
        let val = player.equipped['펫'].petEffect.value;
        player.party.forEach((p, i) => {
            if(p.hp > 0) { let s = p.isPlayer ? getTotalStats(0) : getTotalStats(i); p.hp = Math.min(s.maxHp, p.hp + Math.floor(s.maxHp * val)); }
        });
    }
}

function startJourney(x, y) { player.targetPos = {x, y}; player.stepsLeft = 5; renderDungeonUI(); }

function stepForward() {
    player.turn++; player.stepsLeft--; 
    applyPetRecovery(); 
    
    if(player.fatigue >= 100) {
        player.party.forEach((p, i) => { let s = p.isPlayer ? getTotalStats(0) : getTotalStats(i); if(p.hp > 0) p.hp = Math.max(0, p.hp - Math.floor(s.maxHp * 0.05)); });
    }
    updateAllStats();
    if(player.party[0].hp <= 0) return fadeTransition(() => { returnToTown(true); });
    
    const checkArr = () => {
        if (player.stepsLeft <= 0) {
            player.pos = {x: player.targetPos.x, y: player.targetPos.y}; 
            if(!player.visited.includes(`${player.pos.x},${player.pos.y}`)) player.visited.push(`${player.pos.x},${player.pos.y}`);
            player.targetPos = null; 
            
            if (player.bossPos && player.pos.x === player.bossPos.x && player.pos.y === player.bossPos.y) return showMessage(`거대한 층의 군주의 기백이 느껴집니다...`, () => startCombat(true));
            else if (player.monumentPos && player.pos.x === player.monumentPos.x && player.pos.y === player.monumentPos.y && !player.monumentFound) {
                player.monumentFound = true; let expGain = 50 * player.floor; player.exp += expGain;
                let msg = `신비로운 푸른빛을 내뿜는 비석을 발견했습니다!<br>경험치 ${f(expGain)} 획득.`;
                if (player.exp >= player.maxExp) { levelUp(); msg += `<br><span style="color:#4caf50;">LEVEL UP!</span>`; }
                return showMessage(msg, renderDungeonUI);
            }
            renderDungeonUI();
        } else renderDungeonUI();
    };

    let r = Math.random(); 
    if (r < 0.4) { startCombat(false); return; }
    if (r >= 0.9) { 
        let msg = "";
        if (Math.random() < 0.02) { 
            let eqTier = Math.min(10, player.floor + Math.floor(Math.random() * 4)); 
            let newEq = generateEquip(eqTier); player.equipList.push(newEq);
            msg = `[보물상자] 눈부신 빛과 함께 [${newEq.name}] 획득!`;
        } else {
            let gainG = Math.floor(Math.random() * 50) + 10; player.gold += gainG; msg = `[보물상자] ${f(gainG)}G 획득.`;
        }
        return showMessage(msg, checkArr);
    }
    checkArr();
}

function goNextFloor() { player.floor++; player.maxDungeonDay += 5; generateFloor(); fadeTransition(() => { showMessage(`${player.floor}층에 진입했습니다!<br>던전 유지 기간이 5일 추가되었습니다.`, () => { renderDungeonUI(); }); }); }

function startCombat(isBoss = false) {
    updateDungeonTimer(); 
    let f = player.floor;
    let baseHp = Math.floor(300 * Math.pow(3, f - 1) + (Math.random() * 20)); 
    let baseAtk = Math.floor(40 * Math.pow(3, f - 1) + (Math.random() * 10)); 
    let baseDef = Math.floor(12 * Math.pow(3, f - 1) + (Math.random() * 5));
    
    if (isBoss) {
        let bTier = f + 3; let bName = floorBosses[f] || `심연의 군주`;
        let bImg = monsterImgs[bName] || `https://api.dicebear.com/7.x/pixel-art/svg?seed=Boss${f}`;
        currentEnemy = { isBoss: true, tier: bTier, name: `[${f}층 군주] ${bName}`, img: bImg, maxHp: Math.floor(baseHp * 2.5), hp: Math.floor(baseHp * 2.5), atk: Math.floor(baseAtk * 1.5), def: Math.floor(baseDef * 1.5), luk: 10 * f };
        showMessage(`층의 군주가 등장했다! 도망칠 것인가 싸울 것인가!`, () => { combatState.turnIndex = 0; renderCombatTurn("", false); });
    } else {
        let availableMobs = floorMonsters[f] || ["동굴 슬라임"]; let mName = availableMobs[Math.floor(Math.random() * availableMobs.length)];
        let mImg = monsterImgs[mName] || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${mName}${f}`;
        currentEnemy = { isBoss: false, tier: f, name: `${f}성 ${mName}`, img: mImg, maxHp: baseHp, hp: baseHp, atk: baseAtk, def: baseDef, luk: 5 * f };
        combatState.turnIndex = 0; renderCombatTurn("", false);
    }
}

function toggleAutoCombat() {
    isAutoCombat = !isAutoCombat;
    renderCombatTurn(isAutoCombat ? "자동 전투를 시작합니다." : "자동 전투를 중지했습니다.", false);
}

function autoCombatAction() {
    if (!isAutoCombat || !currentEnemy) return;
    
    let actor = player.party[combatState.turnIndex];
    let availableSkills = jobData[actor.job].skills.filter(s => actor.rank >= s.rank);
    if (actor.isPlayer) player.equipped["정수"].forEach(e => { if (e.skill) availableSkills.push(e.skill); });
    
    let bestSkillIdx = -1; let bestDmg = 0;
    availableSkills.forEach((sk, idx) => {
        if (actor.mp >= sk.mp) {
            let dmg = calcMemberDamage(actor, true, sk.mult);
            if(dmg > bestDmg && !sk.isHolyArrow) { bestDmg = dmg; bestSkillIdx = idx; }
        }
    });
    
    if (bestSkillIdx !== -1) combatAction('skill', bestSkillIdx);
    else combatAction('attack');
}

function renderCombatTurn(logMsg = "", isWaiting = false) {
    if (!isWaiting) while(combatState.turnIndex < player.party.length && player.party[combatState.turnIndex].hp <= 0) combatState.turnIndex++;
    if (currentEnemy && currentEnemy.isArena && combatState.turnIndex > 0) { executeEnemyTurn(); return; }
    if (combatState.turnIndex >= player.party.length && !isWaiting) { executeEnemyTurn(); return; }

    let p = Math.max(0, (currentEnemy.hp / currentEnemy.maxHp) * 100);
    let actorName = isWaiting ? "진행 중..." : (player.party[combatState.turnIndex] ? player.party[combatState.turnIndex].name||player.party[combatState.turnIndex].job : "대기...");
    
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `
        <div id="monster-sprite"><img src="${currentEnemy.img}" class="monster-img"></div>
        <div class="scene-box">
            <div style="font-weight:bold; color:#e53935; margin:5px 0;">${currentEnemy.name} (HP: ${f(currentEnemy.hp)}/${f(currentEnemy.maxHp)})</div>
            <div style="width:100%; height:6px; background:#222; margin-bottom:10px;"><div style="width:${p}%; height:100%; background:#e53935; transition:width 0.3s;"></div></div>
            <div style="font-size:12px; color:#ddd; margin-bottom:10px; min-height:18px;">${logMsg}</div>
            <div style="font-weight:bold; color:#ffd54f;">👉 현재 턴: ${actorName}</div>
        </div>
    `;

    if (isAutoCombat && !isWaiting && combatState.turnIndex < player.party.length) {
        if (!currentEnemy.isArena || (currentEnemy.isArena && combatState.turnIndex === 0)) {
            actionArea.innerHTML = `<div style="text-align:center; padding:20px; color:#777;">( ⚔️ 자동 전투 진행 중... )<br><br><button class="btn" style="border-color:#e53935; color:#e53935;" onclick="toggleAutoCombat()">자동 전투 중지</button></div>`;
            setTimeout(autoCombatAction, 600);
            return;
        }
    }

    if (isWaiting) { actionArea.innerHTML = `<div style="text-align:center; padding:20px; color:#777;">( 잠시 대기... )</div>`; return; }

    let runBtn = "";
    if (combatState.turnIndex === 0) {
        if(currentEnemy.isArena) runBtn = `<div class="icon-btn" onclick="showMessage('투기장에서는 도망칠 수 없습니다!')">${icons.run}<span style="color:#555">불가</span></div>`;
        else runBtn = currentEnemy.isBoss ? `<div class="icon-btn" onclick="combatAction('run')">${icons.run}<span>도망</span></div>` : `<div class="icon-btn" onclick="showMessage('일반 몬스터와는 물러설 수 없습니다!')">${icons.run}<span style="color:#555">불가</span></div>`;
    }
    let bagBtn = currentEnemy.isArena ? `<div class="icon-btn" onclick="showMessage('투기장에서는 포션을 사용할 수 없습니다.')">${icons.bag}<span style="color:#555">불가</span></div>` : `<div class="icon-btn" onclick="openInventory('combat')">${icons.bag}<span>가방 / 장비</span></div>`;
    
    actionArea.innerHTML = `
        <div class="action-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;">
            <div class="icon-btn" onclick="combatAction('attack')">${icons.attack}<span>공격</span></div>
            <div class="icon-btn" onclick="showSkillList()">${icons.skill}<span>스킬</span></div>
            ${bagBtn}
            <div class="icon-btn ${isAutoCombat ? 'auto-active' : ''}" onclick="toggleAutoCombat()">${icons.auto}<span>Auto</span></div>
        </div>
        ${combatState.turnIndex === 0 ? `<div class="action-grid" style="grid-template-columns:1fr; margin-top:8px;">${runBtn}</div>` : ''}
    `;
}

function showSkillList() {
    let actor = player.party[combatState.turnIndex];
    let availableSkills = jobData[actor.job].skills.filter(s => actor.rank >= s.rank);
    if (actor.isPlayer) player.equipped["정수"].forEach(e => { if (e.skill) availableSkills.push(e.skill); });

    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    sceneText.innerHTML = `<div class="scene-box">[스킬 선택 - ${actor.name||actor.job}]</div>`;
    let html = `<div class="action-grid" style="grid-template-columns: 1fr;">`;
    availableSkills.forEach((s, idx) => { html += `<button class="btn" style="border-color:#00e5ff;" onclick="combatAction('skill', ${idx})">${s.n} (MP ${s.mp}) - 계수 ${s.mult}x</button>`; });
    html += `<button class="btn" onclick="renderCombatTurn('행동을 취소했습니다.', false)">돌아가기</button></div>`;
    actionArea.innerHTML = html;
}

function calcMemberDamage(member, isSkill, skillMult = 1.0) {
    let dmg = 0; let s = member.isPlayer ? getTotalStats(0) : member; 
    if(!member.job) return Math.floor((member.atk || 10) * (isSkill ? skillMult : 1.0)); 
    if(member.job.includes('바바리안')) dmg = (s.atk*1.0) + (s.str*0.6) + (s.def*0.3);
    else if(member.job.includes('엘프')) dmg = (s.atk*1.0) + (s.dex*0.8) + (s.str*0.4);
    else if(member.job.includes('드워프')) dmg = (s.atk*1.0) + (s.def*0.5) + (s.str*0.3);
    else if(member.job.includes('마법사')) dmg = (s.matk*1.2) + (s.int*0.8) + (s.maxMp*0.1);
    else if(member.job.includes('도적')) dmg = (s.atk*1.0) + (s.luk*0.8) + (s.dex*0.5);
    else if(member.job.includes('소환사')) dmg = (s.matk*1.0) + (s.int*0.7) + (s.maxMp*0.08);
    return Math.floor(dmg * (isSkill ? skillMult : 1.0));
}

function executeHolyArrow(targetIdx, skillIdx) {
    closeModal();
    let actor = player.party[combatState.turnIndex];
    let availableSkills = jobData[actor.job].skills.filter(s => actor.rank >= s.rank);
    if (actor.isPlayer) player.equipped["정수"].forEach(e => { if (e.skill) availableSkills.push(e.skill); });
    let sk = availableSkills[skillIdx]; actor.mp -= sk.mp; 
    
    let target = player.party[targetIdx];
    let healAmt = Math.floor((actor.isPlayer ? getTotalStats(0).matk : actor.matk) * 0.5); 
    let targetMaxHp = target.isPlayer ? getTotalStats(0).maxHp : getTotalStats(targetIdx).maxHp;
    target.hp = Math.min(targetMaxHp, target.hp + healAmt);
    
    // 💡 4. 투기장 데미지 버그 수정 (Math.max(1) 래핑)
    let rawDmg = Math.max(1, calcMemberDamage(actor, true, sk.mult) - currentEnemy.def);
    if (currentEnemy.isArena) rawDmg = Math.max(1, Math.floor(rawDmg * 0.2)); 
    
    let variance = rawDmg * (0.8 + Math.random() * 0.4);
    let isCrit = Math.random() < 0.1;
    let dmg = Math.floor(isCrit ? variance * 1.5 : variance);
    let critText = isCrit ? ` <span style="color:#ff9800; font-weight:bold;">(크리티컬!)</span>` : "";
    
    let eEvade = Math.min(0.2, (currentEnemy.luk || 0) / 500);
    let log = "";
    if (Math.random() < eEvade) {
        log = `[${actor.name||actor.job}]의 [${sk.n}]! <span style="color:#aaa;">하지만 적이 공격을 회피했습니다!</span><br><span style="color:#4caf50">${target.name||target.job} 체력 ${f(healAmt)} 회복!</span>`;
    } else {
        log = `[${actor.name||actor.job}]의 [${sk.n}]! 적에게 ${f(dmg)} 피해.${critText}<br><span style="color:#4caf50">${target.name||target.job} 체력 ${f(healAmt)} 회복!</span>`;
        currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    }
    proceedCombat(log);
}

function combatAction(act, skillIdx) {
    let actor = player.party[combatState.turnIndex]; let log = ""; let dmg = 0;
    
    if (act === 'attack' || act === 'skill') {
        let sk = null;
        if(act === 'skill') {
            let availableSkills = jobData[actor.job].skills.filter(s => actor.rank >= s.rank);
            if (actor.isPlayer) player.equipped["정수"].forEach(e => { if (e.skill) availableSkills.push(e.skill); });
            sk = availableSkills[skillIdx];
            if (actor.mp < sk.mp) { isAutoCombat = false; return renderCombatTurn("마나가 부족합니다!", false); }
            
            if (sk.isHolyArrow) {
                if(isAutoCombat) { executeHolyArrow(0, skillIdx); return; } 
                let btns = player.party.map((p, i) => { if(p.hp > 0) return { txt: `${p.name||p.job} 회복`, act: `executeHolyArrow(${i}, ${skillIdx})` }; return null; }).filter(b=>b);
                btns.push({txt: "취소", act: "closeModal()"});
                return showMessage("누구를 회복시키겠습니까?", null, btns);
            }
            actor.mp -= sk.mp;
        }

        if(sk && sk.isHeal) {
            let healAmt = Math.floor((actor.isPlayer ? getTotalStats(0).matk : actor.matk) * sk.mult);
            player.party.forEach((p, i) => { 
                if(p.hp > 0) { let mHp = p.isPlayer ? getTotalStats(0).maxHp : getTotalStats(i).maxHp; p.hp = Math.min(mHp, p.hp + healAmt); } 
            });
            log = `[${actor.name||actor.job}]의 [${sk.n}]! 파티 전체 체력 ${f(healAmt)} 회복.`;
        } else {
            let rawDmg = Math.max(1, calcMemberDamage(actor, !!sk, sk ? sk.mult : 1.0) - currentEnemy.def);
            if (currentEnemy.isArena) rawDmg = Math.max(1, Math.floor(rawDmg * 0.2)); 
            
            let variance = rawDmg * (0.8 + Math.random() * 0.4);
            let isCrit = Math.random() < 0.1;
            dmg = Math.floor(isCrit ? variance * 1.5 : variance);
            
            let eEvade = Math.min(0.2, (currentEnemy.luk || 0) / 500);
            if (Math.random() < eEvade) {
                log = `[${actor.name||actor.job}]의 ${sk?`[${sk.n}]`:'공격'}! <span style="color:#aaa;">하지만 적이 공격을 빗겨냈습니다!</span>`;
            } else {
                let critText = isCrit ? ` <span style="color:#ff9800; font-weight:bold;">(크리티컬!)</span>` : "";
                log = `[${actor.name||actor.job}]의 ${sk?`[${sk.n}]`:'공격'}! 적에게 ${f(dmg)} 피해.${critText}`;
                currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
            }
        }
    } else if (act === 'run') {
        if (!currentEnemy.isBoss) return;
        if (Math.random() < Math.max(0.1, 0.7 - (player.floor * 0.1))) { currentEnemy = null; isAutoCombat = false; return showMessage("도망쳤습니다!", renderDungeonUI); }
        else { log = "도망 실패! 빈틈을 보였다!"; }
    }
    
    proceedCombat(log);
}

function proceedCombat(log) {
    applyPetRecovery(); 
    renderCombatTurn(log, true); 
    playShakeEffect(() => {
        updateAllStats();
        if (currentEnemy && currentEnemy.hp <= 0) return executeWin(log);
        
        combatState.turnIndex++; 
        if(currentEnemy.isArena) { setTimeout(executeEnemyTurn, 400); return; }
        
        let isAllDead = true; let tempIdx = combatState.turnIndex;
        while(tempIdx < player.party.length) { if(player.party[tempIdx].hp > 0) { isAllDead = false; break; } tempIdx++; }
        if (isAllDead || combatState.turnIndex >= player.party.length) setTimeout(executeEnemyTurn, 400); 
        else renderCombatTurn(log, false); 
    });
}

function executeEnemyTurn() {
    let alive = player.party.filter(p => p.hp > 0);
    
    if(alive.length === 0 || (currentEnemy.isArena && player.party[0].hp <= 0)) {
        isAutoCombat = false;
        if(currentEnemy.isArena) {
            currentEnemy = null; let pGain = 0, gGain = 0;
            if(arenaState.round === 2) { pGain = 70; gGain = 2000 * player.rank; } else if(arenaState.round === 4) { pGain = 30; gGain = 1000 * player.rank; } else if(arenaState.round === 8) { pGain = 10; gGain = 500 * player.rank; }
            player.prestige += pGain; player.gold += gGain; let rText = arenaState.round === 2 ? "결승전" : `${arenaState.round}강`;
            player.party.forEach((p,i) => { let ts = p.isPlayer ? getTotalStats(0) : getTotalStats(i); p.hp = ts.maxHp; p.mp = ts.maxMp; }); updateAllStats();
            return showMessage(`[투기장 패배]<br>${rText}에서 탈락했습니다.<br>${pGain>0 ? `위상 +${pGain}, 위로금 ${f(gGain)}G 획득.` : '참가 보상이 없습니다.'}`, renderTownUI);
        }
        return returnToTown(true);
    }
    
    let target;
    if(currentEnemy.isArena) {
        target = player.party[0];
    } else {
        let tankers = alive.filter(p => p.job && p.job.includes('탱커'));
        target = tankers.length > 0 ? tankers[Math.floor(Math.random() * tankers.length)] : alive[Math.floor(Math.random() * alive.length)];
    }
    
    let targetIdx = player.party.findIndex(p => p === target);
    let tStats = target.isPlayer ? getTotalStats(0) : getTotalStats(targetIdx);
    
    let sk = null; let logAction = '공격';
    if(currentEnemy.isArena && Math.random() < 0.3 && currentEnemy.mp > 0) {
        let skills = jobData[currentEnemy.job].skills.filter(s => currentEnemy.tier >= s.rank);
        if(skills.length > 0) { sk = skills[Math.floor(Math.random()*skills.length)]; logAction = `[${sk.n}]`; currentEnemy.mp -= sk.mp || 0; }
    }
    
    let pEvade = Math.min(0.2, (tStats.luk || 0) / 500);
    let log = "";
    
    if (Math.random() < pEvade) {
        log = `[적의 ${logAction}] <span style="color:#aaa;">${target.name||target.job}이(가) 날렵하게 공격을 회피했습니다!</span>`;
    } else {
        let rawDmg = Math.max(1, calcMemberDamage(currentEnemy, !!sk, sk ? sk.mult : 1.0) - tStats.def);
        if (currentEnemy.isArena) rawDmg = Math.max(1, Math.floor(rawDmg * 0.2)); 
        
        let variance = rawDmg * (0.8 + Math.random() * 0.4);
        let isCrit = Math.random() < 0.1;
        let eDmg = Math.floor(isCrit ? variance * 1.5 : variance);
        let critText = isCrit ? ` <span style="color:#ff9800; font-weight:bold;">(크리티컬!)</span>` : "";
        
        target.hp = Math.max(0, target.hp - eDmg); updateAllStats(); 
        log = `[적의 ${logAction}] ${target.name||target.job}에게 ${f(eDmg)} 피해를 입혔다.${critText}`;
    }
    
    renderCombatTurn(log, true);
    
    playShakeEffect(() => {
        if (player.party[0].hp <= 0) {
            isAutoCombat = false;
            if(currentEnemy.isArena) {
                currentEnemy = null; let pGain = 0, gGain = 0;
                if(arenaState.round === 2) { pGain = 70; gGain = 2000 * player.rank; } else if(arenaState.round === 4) { pGain = 30; gGain = 1000 * player.rank; } else if(arenaState.round === 8) { pGain = 10; gGain = 500 * player.rank; }
                player.prestige += pGain; player.gold += gGain; let rText = arenaState.round === 2 ? "결승전" : `${arenaState.round}강`;
                player.party.forEach((p,i) => { let ts = p.isPlayer ? getTotalStats(0) : getTotalStats(i); p.hp = ts.maxHp; p.mp = ts.maxMp; }); updateAllStats();
                return showMessage(`[투기장 패배]<br>${rText}에서 파티장이 쓰러져 탈락했습니다.<br>${pGain>0 ? `위상 +${pGain}, 위로금 ${f(gGain)}G 획득.` : '참가 보상이 없습니다.'}`, renderTownUI);
            }
            return fadeTransition(() => { returnToTown(true); });
        }
        combatState.turnIndex = 0; renderCombatTurn(log, false); 
    });
}

function executeWin(lastLog) {
    if (currentEnemy.isArena) {
        currentEnemy = null; let nextFighters = [];
        for(let i=0; i<arenaState.fighters.length; i+=2) {
            let f1 = arenaState.fighters[i]; let f2 = arenaState.fighters[i+1];
            if (f1.isRealPlayer || f2.isRealPlayer) { nextFighters.push(f1.isRealPlayer ? f1 : f2); } 
            else {
                let f1Power = (f1.atk + f1.matk + f1.def + f1.maxHp*0.2) * Math.pow(3, f1.tier);
                let f2Power = (f2.atk + f2.matk + f2.def + f2.maxHp*0.2) * Math.pow(3, f2.tier);
                let f1WinProb = Math.max(0.1, Math.min(0.9, f1Power / (f1Power + f2Power)));
                nextFighters.push(Math.random() < f1WinProb ? f1 : f2);
            }
        }
        arenaState.fighters = nextFighters;
        
        if(arenaState.round === 2) {
            player.prestige += 100; player.gold += 5000 * player.rank; let eq = generateEquip(player.rank + 2); player.equipList.push(eq);
            showMessage(`🎉 <b>투기장 최종 우승!</b> 🎉<br>모든 상대를 꺾었습니다!<br>위상 +100, 상금 ${f(5000*player.rank)}G, 장비 [${eq.name}] 획득!`, renderTownUI);
        } else {
            arenaState.round /= 2; showMessage(`승리했습니다! 다음 라운드로 진출합니다.`, showBracketUI);
        }
        return;
    }

    isAutoCombat = false; 
    let wLog = `${lastLog}<br><br>전투 승리! `; 
    let gExp = currentEnemy.isBoss ? Math.floor(150 * Math.pow(2.5, player.floor - 1)) : Math.floor(40 * Math.pow(2.5, player.floor - 1));
    let dropTier = currentEnemy.tier; let dRate = dropRates[Math.min(9, dropTier - 1)] || 0.001; 
    
    player.dungeonKills++; player.monthsWithoutKill = 0; 
    if(currentEnemy.isBoss) player.bossKills[player.floor] = (player.bossKills[player.floor] || 0) + 1;
    else player.mobKills[player.floor] = (player.mobKills[player.floor] || 0) + 1;
    
    if (currentEnemy.isBoss || Math.random() < dRate) { let newEq = generateEquip(dropTier); player.equipList.push(newEq); wLog += `<br><span style="color:#ffd54f">🎉 장비 [${newEq.name}] 획득!</span>`; }
    if (currentEnemy.isBoss || Math.random() < dRate) {
        let mobName = currentEnemy.name.replace(/\[.*?층 군주\] |\[군주\] |\d+성 /g, '');
        let ess = { id: Date.now()+Math.random(), name: `${dropTier}성 ${mobName}의 정수`, tier: dropTier, passive: `[패시브] 올스탯 +${dropTier}%`, skill: { n: `${mobName}의 일격`, rank: 1, mp: 15 + (dropTier*5), mult: 1.5 + (dropTier*0.2) } };
        player.essenceList.push(ess); wLog += `<br><span style="color:#00e5ff">💎 신비로운 [${ess.name}] 획득!</span>`;
    }
    if (currentEnemy.isBoss) { player.bossPos = null; }

    let goldGain = (currentEnemy.isBoss ? 300 : 50) * player.floor; let perGold = goldGain / player.party.length; player.gold += perGold;
    let oreGain = currentEnemy.isBoss ? 3 : 1; let perOre = oreGain / player.party.length; player.items.ore += perOre;
    
    wLog += `<br>골드 ${f(goldGain)}G (인당 +${f(perGold)}G), 원석 ${f(oreGain)}개 (인당 +${perOre.toFixed(2)}개), 경험치 ${f(gExp)} 획득.`;
    player.exp += gExp; if (player.exp >= player.maxExp) { levelUp(); wLog += `<br><span style="color:#4caf50; font-weight:bold;">LEVEL UP! 파티원의 체/마가 회복되었습니다.</span>`; }
    updateAllStats(); return showMessage(wLog, () => { currentEnemy = null; document.getElementById('dungeon-bg').classList.remove('hidden'); renderDungeonUI(); });
}

function returnToTown(isGameOver) {
    player.inDungeon = false; currentEnemy = null; isAutoCombat = false; document.getElementById('dungeon-bg').classList.add('hidden');
    let kills = player.dungeonKills || 0; let reward = Math.floor(kills / 5) * 500;
    player.dungeonKills = 0; player.bossPos = null; player.monumentPos = null; player.targetPos = null;
    
    let msg = "";
    if (isGameOver) {
        let penalty = Math.floor(player.maxExp * 0.15); player.exp = Math.max(0, player.exp - penalty);
        player.gold = Math.floor(player.gold / 2); player.items = { food: 0, hpPotion: 0, mpPotion: 0, ore: 0, envelope: player.items.envelope || 0, petBox: player.items.petBox || 0 }; player.hunger = 0; player.fatigue = 0;
        msg = `[치명타] 파티장이 기절했습니다...<br>가진 소모품 전부와 골드 절반을 잃고 마을로 실려갑니다.`;
    } else msg = "무사히 던전에서 귀환했습니다!";

    if (reward > 0) { player.gold += reward; msg += `<br><br><span style="color:#ffd54f">마을 주민들이 몬스터 ${f(kills)}마리 토벌에 감사하며 <b>${f(reward)}G</b>의 후원금을 건넸습니다!</span>`; }
    
    let ts = getTotalStats(0); player.party[0].hp = ts.maxHp; player.party[0].mp = ts.maxMp; saveGame(); showMessage(msg, renderTownUI);
}

// 💡 8. 펫 효과 텍스트 포맷 수정 (가독성 개선)
function renderEquipSlots() {
    let eqObj = player.equipped;
    let emptyIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="#555"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`;
    
    let getEq = (type) => eqObj[type] ? `<div class="eq-slot filled" onclick="confirmUnequip('${type}', null)"><span class="eq-slot-title">[${type}]</span>${eqObj[type].name}</div>` : `<div class="eq-slot"><span class="eq-slot-title">[${type}]</span>${emptyIcon}</div>`;
    let getRing = (idx) => eqObj['반지'][idx] ? `<div class="eq-slot filled" onclick="confirmUnequip('반지', ${idx})"><span class="eq-slot-title">[반지${idx+1}]</span>${eqObj['반지'][idx].name}</div>` : `<div class="eq-slot"><span class="eq-slot-title">[반지${idx+1}]</span>${emptyIcon}</div>`;
    let getEss = (idx) => eqObj['정수'][idx] ? `<div class="eq-slot es-slot filled" onclick="destroyEssenceConfirm(${idx})"><span class="eq-slot-title">[정수${idx+1}]</span>${eqObj['정수'][idx].name}</div>` : `<div class="eq-slot es-slot"><span class="eq-slot-title">[정수${idx+1}]</span>${emptyIcon}</div>`;
    let getPet = () => eqObj['펫'] ? `<div class="eq-slot filled" onclick="confirmUnequip('펫', null)"><span class="eq-slot-title">[펫]</span>${eqObj['펫'].name}</div>` : `<div class="eq-slot"><span class="eq-slot-title">[펫]</span>${emptyIcon}</div>`;

    let html = `
        <div style="position:absolute; top:2px; left:calc(50% - 24px);">${getEq('모자')}</div>
        <div style="position:absolute; top:55px; left:calc(50% - 24px);">${getEq('목걸이')}</div>
        <div style="position:absolute; top:110px; left:calc(50% - 24px);">${getEq('상의')}</div>
        <div style="position:absolute; top:180px; left:calc(50% - 24px);">${getEq('하의')}</div>
        <div style="position:absolute; top:260px; left:calc(50% - 24px);">${getEq('신발')}</div>
        
        <div style="position:absolute; top:110px; left:20px;">${getEq('무기')}</div>
        <div style="position:absolute; top:180px; left:20px;">${getEq('장갑')}</div>
        <div style="position:absolute; top:240px; left:20px;">${getRing(0)}</div>
        
        <div style="position:absolute; top:110px; right:20px;">${getEq('망토')}</div>
        <div style="position:absolute; top:180px; right:20px;">${getEq('팔찌')}</div>
        <div style="position:absolute; top:240px; right:20px;">${getRing(1)}</div>
        
        <div style="position:absolute; bottom:0px; right:0px;">${getPet()}</div>
    `;
    document.getElementById('paper-doll').innerHTML = html;
    document.getElementById('essence-slots').innerHTML = `${getEss(0)}${getEss(1)}`;
}

function openInventory(context) {
    const sceneText = document.getElementById('scene-text'); const actionArea = document.getElementById('action-area');
    document.getElementById('equip-ui-overlay').classList.remove('hidden'); document.getElementById('dungeon-bg').classList.add('hidden'); renderEquipSlots();
    let backFunc = context === 'town' ? 'renderTownUI()' : (context === 'combat' ? `document.getElementById('equip-ui-overlay').classList.add('hidden'); renderCombatTurn('가방을 닫았다.', false)` : 'renderDungeonUI()');
    
    let html = `<div style="display:flex; flex-direction:column; gap:8px;">
        <div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.food} 식량 (${f(player.items.food)}) (허기 100 회복)</div><button class="btn inv-btn" onclick="useItem('food','${context}')">먹기</button></div></div>
        <div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.hp} HP포션 (${f(player.items.hpPotion)})</div><button class="btn inv-btn" onclick="useItem('hpPotion','${context}')">사용</button></div></div>
        <div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.mp} MP포션 (${f(player.items.mpPotion)})</div><button class="btn inv-btn" onclick="useItem('mpPotion','${context}')">사용</button></div></div>
    `;
    
    if(player.items.envelope > 0) html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">🧧 새해 축하 봉투 (${f(player.items.envelope)})</div><button class="btn inv-btn" style="border-color:#ff9800; color:#ff9800;" onclick="useEnvelope('${context}')">열기</button></div><div class="inv-stats">운이 좋다면 많은 골드나 귀한 정수를 얻을 수 있습니다.</div></div>`;
    if(player.items.petBox > 0) html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">🐾 펫 소환 상자 (${f(player.items.petBox)})</div><button class="btn inv-btn" style="border-color:#4caf50; color:#4caf50;" onclick="usePetBox('${context}')">열기</button></div><div class="inv-stats">다양한 등급과 타입의 펫이 나옵니다.</div></div>`;

    player.essenceList.forEach((ess, idx) => { html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.ore} <span style="color:#eee;">[정수] ${ess.name}</span></div><button class="btn inv-btn" onclick="toggleEssence(${idx}, '${context}')">장착</button></div><div class="inv-stats">${ess.passive}${ess.skill ? ` / ${ess.skill.n}` : ''}</div></div>`; });
    
    player.equipList.forEach((eq, idx) => { 
        let statText = eq.type === '펫' ? (eq.petEffect.type === '회복형' ? `[${eq.petEffect.type}] 턴 시작 시 체력 ${Math.round(eq.petEffect.value * 100)}% 회복` : `[${eq.petEffect.type}] 성능: ${Math.round(eq.petEffect.value * 100)}% 증가`) : Object.keys(eq.stats).map(k => `${statNames[k]}+${f(eq.stats[k])}`).join(', '); 
        html += `<div class="inv-item"><div class="inv-header"><div class="inv-info">${icons.equip} <span style="color:#eee;">[${eq.type}] ${eq.name}</span></div><button class="btn inv-btn" onclick="toggleEquip(${idx}, '${context}')">장착</button></div><div class="inv-stats">${statText}</div></div>`; 
    });

    html += `</div><button class="btn" style="margin-top:12px; width:100%" onclick="${backFunc}">돌아가기</button>`;
    if(actionArea) actionArea.innerHTML = html;
}

function usePetBox(context) {
    player.items.petBox--;
    let r = Math.random() * 100;
    let tier = 1, tierName = "일반", color = "#ccc", val = 0.03;
    if (r < 0.5) { tier = 5; tierName = "신화"; color = "#ff5252"; val = 0.15; }
    else if (r < 5.0) { tier = 4; tierName = "전설"; color = "#ff9800"; val = 0.12; }
    else if (r < 15.0) { tier = 3; tierName = "영웅"; color = "#ce93d8"; val = 0.09; }
    else if (r < 40.0) { tier = 2; tierName = "희귀"; color = "#00e5ff"; val = 0.06; }

    let types = ['회복형', '방어형', '공격형']; let type = types[Math.floor(Math.random() * types.length)];

    let pet = { id: Date.now() + Math.random(), type: '펫', name: `<span style="color:${color}">[${tierName}] ${type} 펫</span>`, tier: tier, stats: {}, petEffect: { type: type, value: val, tierName: tierName } };
    player.equipList.push(pet); updateAllStats();
    showMessage(`🐾 펫 상자를 열었습니다!<br><br><span style="font-size:16px;">${pet.name}</span> 획득!`, () => openInventory(context));
}

function useEnvelope(context) {
    player.items.envelope--; let r = Math.random() * 100; let msg = "";
    if (r < 1) {
        let ess = { id: Date.now()+Math.random(), name: `2성 신년의 정수`, tier: 2, passive: `[패시브] 올스탯 +2%`, skill: { n: `새해의 축복`, rank: 1, mp: 30, mult: 2.0 } };
        player.essenceList.push(ess); msg = `[1% 기적 당첨!] <span style="color:#00e5ff">💎 2성 신년의 정수 획득!</span>`;
    } else if (r < 5) { player.gold += 10000; msg = `[4% 당첨!] <b>10,000G</b> 획득!`;
    } else if (r < 15) { player.gold += 8000; msg = `[10% 당첨!] <b>8,000G</b> 획득!`;
    } else if (r < 45) { player.gold += 5000; msg = `[30% 당첨!] <b>5,000G</b> 획득!`;
    } else { player.gold += 3000; msg = `[55% 당첨!] <b>3,000G</b> 획득!`; }
    updateAllStats(); showMessage(msg, () => openInventory(context));
}

function toggleEquip(idx, context) {
    let oldCP = getCombatPower(player.party[0], 0);
    let eq = player.equipList.splice(idx, 1)[0];
    if (eq.type === '반지') {
        if (player.equipped['반지'].length >= 2) { player.equipList.push(eq); return showMessage("반지는 최대 2개까지만 착용 가능합니다."); }
        player.equipped['반지'].push(eq);
    } else {
        if (player.equipped[eq.type]) player.equipList.push(player.equipped[eq.type]);
        player.equipped[eq.type] = eq;
    }
    updateAllStats(); showCPToast(oldCP, getCombatPower(player.party[0], 0)); openInventory(context);
}

function confirmUnequip(type, ringIdx) {
    let eq = type === '반지' ? player.equipped['반지'][ringIdx] : player.equipped[type]; if(!eq) return;
    showMessage(`해제하시겠습니까?`, null, [{txt:"해제하기", act:`executeUnequip('${type}', ${ringIdx})`}, {txt:"취소", act:"closeModal()"}]);
}

function executeUnequip(type, ringIdx) {
    closeModal(); let oldCP = getCombatPower(player.party[0], 0);
    if (type === '반지') { let eq = player.equipped['반지'].splice(ringIdx, 1)[0]; if(eq) player.equipList.push(eq); } 
    else { let eq = player.equipped[type]; player.equipped[type] = null; if(eq) player.equipList.push(eq); }
    updateAllStats(); showCPToast(oldCP, getCombatPower(player.party[0], 0)); openInventory(player.inDungeon ? (currentEnemy ? 'combat' : 'dungeon') : 'town');
}

function toggleEssence(idx, context) {
    let oldCP = getCombatPower(player.party[0], 0);
    if (player.equipped["정수"].length >= 2) return showMessage("정수는 최대 2개까지만 장착 가능합니다.");
    let ess = player.essenceList.splice(idx, 1)[0]; player.equipped["정수"].push(ess); updateAllStats(); showCPToast(oldCP, getCombatPower(player.party[0], 0)); openInventory(context);
}

function destroyEssenceConfirm(idx) { if(!player.equipped["정수"][idx]) return; showMessage("정말로 파괴하시겠습니까? (장착 해제 및 영구 파괴)", null, [{txt:"파괴하기", act:`executeDestroyEssence(${idx})`}, {txt:"취소", act:"closeModal()"}]); }
function executeDestroyEssence(idx) { closeModal(); let oldCP = getCombatPower(player.party[0], 0); player.equipped["정수"].splice(idx, 1); updateAllStats(); showCPToast(oldCP, getCombatPower(player.party[0], 0)); openInventory(player.inDungeon ? (currentEnemy ? 'combat' : 'dungeon') : 'town'); }

function useItem(type, context) {
    if (player.items[type] <= 0) return showMessage("부족합니다!");
    if (type === 'food') { player.items.food--; player.hunger = 100; showMessage("식량 섭취! 허기가 100으로 회복되었습니다.", () => openInventory(context)); updateAllStats(); return; }
    if (player.party.length > 1) {
        let btns = player.party.map((p, i) => ({ txt: `${p.name||p.job}에게 사용`, act: `closeModal(); applyItem('${type}', ${i}, '${context}')` }));
        btns.push({txt: "취소", act: "closeModal()"}); showMessage("누구에게 사용할까요?", null, btns);
    } else applyItem(type, 0, context);
}

function applyItem(type, targetIdx, context) {
    player.items[type]--; let target = player.party[targetIdx]; let ts = target.isPlayer ? getTotalStats(0) : getTotalStats(targetIdx);
    if (type === 'hpPotion') { target.hp = Math.min(ts.maxHp, target.hp + 50); showMessage(`${target.name||target.job}의 HP가 50 회복되었습니다!`, () => openInventory(context)); } 
    else if (type === 'mpPotion') { target.mp = Math.min(ts.maxMp, target.mp + 30); showMessage(`${target.name||target.job}의 MP가 30 회복되었습니다!`, () => openInventory(context)); }
    updateAllStats();
}

function generateEquip(tier) {
    let type = equipTypes[Math.floor(Math.random() * equipTypes.length)]; let numStats = Math.min(tier, 9);
    let statPool = ['atk', 'matk', 'str', 'dex', 'luk', 'int', 'maxHp', 'maxMp', 'def']; statPool.sort(() => 0.5 - Math.random());
    const minVals = [0, 1, 3, 8, 13, 20, 30, 45, 65, 90, 120]; const maxVals = [0, 5, 10, 15, 25, 40, 60, 85, 115, 150, 200];
    let stats = {}; for(let i=0; i<numStats; i++) stats[statPool[i]] = Math.floor(Math.random() * (maxVals[tier] - minVals[tier] + 1)) + minVals[tier];
    return { id: Date.now() + Math.random(), type: type, name: `T${tier} ${type}`, tier: tier, stats: stats };
}