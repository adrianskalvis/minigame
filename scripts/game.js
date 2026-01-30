const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const diagBox = document.getElementById("dialogue-text");
const nextBtn = document.getElementById("next-diag-btn");
const backBtn = document.getElementById("back-diag-btn");
const hintBox = document.getElementById("pickup-hint");
const editor = document.getElementById("codeEditor");
const modal = document.getElementById("modal-overlay");

const COLS = 9, ROWS = 10;

let gameState = {
    lvl: 1, player: { x: 4, y: 8 }, startPos: { x: 4, y: 8 }, goal: { x: 4, y: 1 },
    items: [], inventory: [], mobs: [], vines: [], isRunning: false, diagIdx: -1,
    isTyping: false, typeInterval: null
};

const stories = {
    1: [
        "Ikdienā suņuks spēj iemācīties apsēsties, kad pasaki Sēdi! Kā arī apgulties, kad pasaki Guli! Tās ir komandas.",
        "Vai zināji, ka arī tagad TU vari turpināt uzdot komandas datoram? To sauc par programmēšanu! 🙂",
        "Bet labi, Mēs esam CodeQuest pasaulē! Mūsu mērķis ir izglābt princesi. Burvis Tev palīdzēs!",
        "P.S. Rakstot kodu, par garumzīmēm neuztraucies, jo pārsvarā programmēšanas kods tiek rakstīts angļu valodā!",
        "BURVIS: Sveiks! Raksti iet(); lai dotos uz priekšu. Neaizmirsti semikolu ';' beigās!"
    ],
    2: [
        "Lieliski! Programmēšana ir precīzu instrukciju došana.",
        "BURVIS: Lieto paKreisi(); paLabi(); un ietAtpakal(); lai atrastu rīkus.",
        "BURVIS: Izmanto nemt(); kad esi veiksmīgi nonācis pie kāda priekšmeta!"
    ],
    3: [
        "Sargies! Gariņš sargā ceļu.",
        "BURVIS: Liānas, kas ir tieši blakus gariņam, ir bīstamas! Ja tās aiztiksi, viņš tevi noķers.",
        "BURVIS: Izmanto zobens(); tikai tām liānām, kas nav gariņa kaimiņos!"
    ]
};

const levels = {
    1: { goal: {x: 4, y: 1, s: "🧙‍♂️"}, start: {x: 4, y: 8}, items: [], mobs: [], vines: [], placeholder: "iet();" },
    2: { goal: {x: 4, y: 1, s: "🏰"}, start: {x: 4, y: 8}, items: [{x:2, y:4, s:"🗡️"}, {x:6, y:4, s:"❤️"}], mobs: [], vines: [], placeholder: "iet();" },
    3: { goal: {x: 4, y: 1, s: "👸"}, start: {x: 4, y: 8}, mobs: [{x:4, y:4, s: "👻"}], vines: [{x:0, y:4, s:"🌿"}, {x:1, y:4, s:"🌿"}, {x:2, y:4, s:"🌿"}, {x:3, y:4, s:"🌿"}, {x:5, y:4, s:"🌿"}, {x:6, y:4, s:"🌿"}, {x:7, y:4, s:"🌿"}, {x:8, y:4, s:"🌿"}], placeholder: "zobens();" }
};

function initLevel(n) {
    modal.style.display = "none";
    gameState.lvl = n;
    gameState.diagIdx = -1;
    gameState.player = { ...levels[n].start };
    gameState.startPos = { ...levels[n].start };
    gameState.items = JSON.parse(JSON.stringify(levels[n].items || []));
    gameState.inventory = [];
    gameState.mobs = levels[n].mobs || [];
    gameState.vines = JSON.parse(JSON.stringify(levels[n].vines || []));
    gameState.goal = levels[n].goal;
    editor.value = "";
    editor.placeholder = levels[n].placeholder;
    advanceDialogue(true);
    resize();
}

function resize() {
    const container = document.getElementById('game-container');
    const uiLayer = document.getElementById('ui-layer');
    if (!container || !uiLayer) return;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height - uiLayer.offsetHeight;
    draw();
}

window.addEventListener('resize', () => setTimeout(resize, 100));
editor.addEventListener('focus', () => setTimeout(resize, 300));
editor.addEventListener('blur', () => setTimeout(resize, 300));

function draw() {
    if (!canvas.width || !canvas.height) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4a7c44";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const t = Math.min(canvas.width / COLS, canvas.height / ROWS);
    const offX = (canvas.width - t * COLS) / 2;
    const offY = (canvas.height - t * ROWS) / 2;

    ctx.save();
    ctx.translate(offX, offY);

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    for(let i=0; i<=COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i*t, 0); ctx.lineTo(i*t, ROWS*t); ctx.stroke();
    }
    for(let j=0; j<=ROWS; j++) {
        ctx.beginPath(); ctx.moveTo(0, j*t); ctx.lineTo(COLS*t, j*t); ctx.stroke();
    }

    ctx.font = `${t * 0.7}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(gameState.goal.s, gameState.goal.x * t + t/2, gameState.goal.y * t + t/2);
    gameState.items.forEach(it => ctx.fillText(it.s, it.x * t + t/2, it.y * t + t/2));
    gameState.vines.forEach(v => ctx.fillText(v.s, v.x * t + t/2, v.y * t + t/2));
    gameState.mobs.forEach(m => ctx.fillText(m.s, m.x * t + t/2, m.y * t + t/2));
    ctx.fillText("⚔️", gameState.player.x * t + t/2, gameState.player.y * t + t/2);

    ctx.restore();
}

function typeWriter(text, animate) {
    clearInterval(gameState.typeInterval);
    if (!animate) {
        diagBox.innerHTML = text;
        gameState.isTyping = false;
        updateButtons();
        return;
    }
    diagBox.innerHTML = "";
    gameState.isTyping = true;
    updateButtons();
    let i = 0;
    gameState.typeInterval = setInterval(() => {
        diagBox.innerHTML += text.charAt(i);
        i++;
        if (i >= text.length) {
            clearInterval(gameState.typeInterval);
            gameState.isTyping = false;
            updateButtons();
        }
    }, 25);
}

function updateButtons() {
    const list = stories[gameState.lvl];
    if (gameState.isTyping) {
        nextBtn.style.visibility = "visible";
        backBtn.style.visibility = "hidden";
    } else {
        nextBtn.style.visibility = gameState.diagIdx < list.length - 1 ? "visible" : "hidden";
        backBtn.style.visibility = gameState.diagIdx > 0 ? "visible" : "hidden";
    }
}

function advanceDialogue(animate = false) {
    if (gameState.isTyping) {
        clearInterval(gameState.typeInterval);
        diagBox.innerHTML = stories[gameState.lvl][gameState.diagIdx];
        gameState.isTyping = false;
        updateButtons();
        return;
    }
    if (gameState.diagIdx < stories[gameState.lvl].length - 1) {
        gameState.diagIdx++;
        typeWriter(stories[gameState.lvl][gameState.diagIdx], animate);
    }
}

function regressDialogue() {
    if (gameState.isTyping) return;
    if (gameState.diagIdx > 0) {
        gameState.diagIdx--;
        typeWriter(stories[gameState.lvl][gameState.diagIdx], false);
    }
}

async function runScript() {
    if (gameState.isRunning) return;
    gameState.isRunning = true;
    const lines = editor.value.split('\n');
    for (let line of lines) {
        if (!gameState.isRunning) break;
        let rawLine = line.trim();
        if (!rawLine) continue;
        if (!rawLine.endsWith(";")) {
            gameState.isRunning = false;
            showModal("Kļūda", "Pieliec semikolu ';' beigās!", "LABOT", () => { modal.style.display="none"; });
            return;
        }
        const cmd = rawLine.replace(";", "").toLowerCase();
        let nX = gameState.player.x, nY = gameState.player.y;

        let isMove = false;
        if (cmd === "iet()") { nY--; isMove = true; }
        else if (cmd === "ietatpakal()") { nY++; isMove = true; }
        else if (cmd === "pakreisi()") { nX--; isMove = true; }
        else if (cmd === "palabi()") { nX++; isMove = true; }
        else if (cmd === "nemt()" || cmd === "panemt()") {
            const idx = gameState.items.findIndex(it => it.x === gameState.player.x && it.y === gameState.player.y);
            if (idx !== -1) { gameState.inventory.push(gameState.items[idx]); gameState.items.splice(idx, 1); }
        }
        else if (cmd === "zobens()") {
            const ghost = gameState.mobs[0];
            const distToGhost = ghost ? Math.sqrt(Math.pow(gameState.player.x - ghost.x, 2) + Math.pow(gameState.player.y - ghost.y, 2)) : 100;
            if (distToGhost < 1.5) {
                gameState.isRunning = false;
                showModal("KĻŪDA", "Gariņš tevi piebeidza duelī!", "MĒĢINĀT", () => { modal.style.display="none"; resetPlayer(); });
                return;
            }
            gameState.vines = gameState.vines.filter(v => Math.abs(v.x-gameState.player.x)>1 || Math.abs(v.y-gameState.player.y)>1);
        }

        const ghost = gameState.mobs[0];
        if (ghost && nX === ghost.x && nY === ghost.y) {
            gameState.isRunning = false;
            showModal("KĻŪDA", "Gariņš tevi noķēra!", "MĒĢINĀT", () => { modal.style.display="none"; resetPlayer(); });
            return;
        }

        let hit = gameState.vines.find(v => v.x === nX && v.y === nY);
        if (hit && isMove) { nX = gameState.player.x; nY = gameState.player.y; }

        if (nX >= 0 && nX < COLS) gameState.player.x = nX;
        if (nY >= 0 && nY < ROWS) gameState.player.y = nY;

        checkLogic(); draw();
        await new Promise(r => setTimeout(r, 300));
    }
    gameState.isRunning = false;
}

function checkLogic() {
    const onItem = gameState.items.some(it => it.x === gameState.player.x && it.y === gameState.player.y);
    hintBox.style.display = onItem ? "block" : "none";

    if (gameState.player.x === gameState.goal.x && gameState.player.y === gameState.goal.y) {
        if (gameState.lvl === 2 && gameState.inventory.length < 2) {
            gameState.isRunning = false;
            typeWriter("BURVIS: Tev vajag gan sirdi, gan zobenu!", true);
            return;
        }
        gameState.isRunning = false;
        if (gameState.lvl < 3) {
            showModal("APSVEICAMI", "Līmenis pabeigts!", "NĀKAMAIS", () => initLevel(gameState.lvl + 1));
        } else {
            showModal("Lieliski!", "Tu izglābi princesi!", "TĀLĀK", () => {
                showModal("UZVARA", "Tu kļuvi par koda meistaru!", "SĀKT NO JAUNA", () => initLevel(1));
            });
        }
    }
}

function showModal(t, m, b, c) {
    document.getElementById("modal-title").innerText = t;
    document.getElementById("modal-msg").innerText = m;
    document.getElementById("modal-primary-btn").innerText = b;
    document.getElementById("modal-primary-btn").onclick = c;
    modal.style.display = "flex";
}

function resetPlayer() {
    gameState.player = { ...gameState.startPos };
    gameState.items = JSON.parse(JSON.stringify(levels[gameState.lvl].items || []));
    gameState.vines = JSON.parse(JSON.stringify(levels[gameState.lvl].vines || []));
    gameState.inventory = [];
    draw();
}

initLevel(1);