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
        "Ikdienā suņuks spēj iemācīties apsēsties, kad pasaki Sēdi!, un apgulties, kad pasaki Guli!. Tās ir komandas.",
        "Vai zināji, ka arī tagad TU vari turpināt uzdot komandas datoram? To sauc par programmēšanu! 🙂",
        "Bet labi, Mēs esam nonākuši CodeQuest pasaulītē! Un Mūsu mērķis ir izglābt princesi, turpmāk Tev burvis palīdzēs ar komandām, veiksmi!",
        "BURVIS: Sveiks cilvēk! Raksti uzPriekšu(); lai dotos uz ziemeļiem. Neaizmirsti semikolu ';' beigās!"
    ],
    2: [
        "Lieliski! Programmēšana ir precīzu instrukciju došana.",
        "BURVIS: Lieto paKreisi(); paLabi(); un uzLeju(); lai atrastu rīkus.",
        "BURVIS: Izmanto ņemt(); kad stāvi uz priekšmeta!"
    ],
    3: [
        "Sargies! Gariņš sargā ceļu un viņš nav draudzīgi noskaņots.",
        "BURVIS: Liānas, kas ir tieši blakus gariņam, ir bīstamas! Ja tās aiztiksi, viņš tevi noķers.",
        "BURVIS: Izmanto zobens(); tikai tām liānām, kas nav gariņa kaimiņos!"
    ]
};

const levels = {
    1: { goal: {x: 4, y: 1, s: "🧙‍♂️"}, start: {x: 4, y: 8}, items: [], mobs: [], vines: [], placeholder: "uzPriekšu();" },
    2: { goal: {x: 4, y: 1, s: "🏰"}, start: {x: 4, y: 8}, items: [{x:2, y:4, s:"🗡️"}, {x:6, y:4, s:"❤️"}], mobs: [], vines: [], placeholder: "uzPriekšu();" },
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
    draw();
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
        nextBtn.style.display = "block";
        backBtn.style.visibility = "hidden";
    } else {
        nextBtn.style.visibility = gameState.diagIdx < list.length - 1 ? "visible" : "hidden";
        nextBtn.style.display = gameState.diagIdx < list.length - 1 ? "block" : "none";
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

        if (cmd === "uzpriekšu()") nY--;
        else if (cmd === "uzleju()") nY++;
        else if (cmd === "pakreisi()") nX--;
        else if (cmd === "palabi()") nX++;
        else if (cmd === "ņemt()") {
            const idx = gameState.items.findIndex(it => it.x === gameState.player.x && it.y === gameState.player.y);
            if (idx !== -1) { gameState.inventory.push(gameState.items[idx]); gameState.items.splice(idx, 1); }
        }
        else if (cmd === "zobens()") {
            const ghost = gameState.mobs[0];
            const nearbyVines = gameState.vines.filter(v => Math.abs(v.x-gameState.player.x)<=1 && Math.abs(v.y-gameState.player.y)<=1);
            // Ernest help
            const dangerousAction = nearbyVines.some(v => ghost && Math.abs(v.x-ghost.x) < 1.1 && Math.abs(v.y-ghost.y) < 1.1);

            if (dangerousAction) {
                gameState.isRunning = false;
                showModal("KĻŪDA", "Gariņš tevi noķēra! Nocirti liānas par tuvu viņam.", "MĒĢINĀT", () => { modal.style.display="none"; resetPlayer(); });
                return;
            }
            gameState.vines = gameState.vines.filter(v => Math.abs(v.x-gameState.player.x)>1 || Math.abs(v.y-gameState.player.y)>1);
        }

        let hit = gameState.vines.find(v => v.x === nX && v.y === nY);
        if (hit) {
            let ghost = gameState.mobs[0];
            if (ghost && Math.abs(hit.x - ghost.x) < 1.1) {
                gameState.isRunning = false;
                showModal("AIZLIEGTS", "Tu iepinies liānās pie gariņa!", "MĒĢINĀT", () => { modal.style.display="none"; resetPlayer(); });
                return;
            }
            gameState.vines = gameState.vines.filter(v => v !== hit);
        }

        if (nX >= 0 && nX < COLS) gameState.player.x = nX;
        if (nY >= 0 && nY < ROWS) gameState.player.y = nY;

        checkLogic(); draw();
        await new Promise(r => setTimeout(r, 250));
    }
    gameState.isRunning = false;
}

function checkLogic() {
    const onItem = gameState.items.some(it => it.x === gameState.player.x && it.y === gameState.player.y);
    hintBox.style.display = onItem ? "block" : "none";

    if (gameState.player.x === gameState.goal.x && gameState.player.y === gameState.goal.y) {
        if (gameState.lvl === 2 && gameState.inventory.length < 2) {
            gameState.isRunning = false;
            typeWriter("BURVIS: Tev vajag gan sirdi, gan zobenu! Lieto ņemt();", true);
            return;
        }
        gameState.isRunning = false;
        if (gameState.lvl < 3) showModal("APSVEICAMI", "Līmenis pabeigts!", "NĀKAMAIS", () => initLevel(gameState.lvl + 1));
        else showModal("UZVARA", "Tu kļuvi par koda meistaru!", "SĀKT NO JAUNA", () => initLevel(1));
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

function draw() {
    if (!canvas.width) resize();
    ctx.fillStyle = "#4a7c44"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const t = canvas.width / COLS;
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    for(let i=0; i<=COLS; i++) { ctx.beginPath(); ctx.moveTo(i*t,0); ctx.lineTo(i*t,canvas.height); ctx.stroke(); }
    for(let j=0; j<=ROWS; j++) { ctx.beginPath(); ctx.moveTo(0,j*t); ctx.lineTo(canvas.width,j*t); ctx.stroke(); }
    ctx.font = `${t * 0.8}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(gameState.goal.s, gameState.goal.x * t + t/2, gameState.goal.y * t + t/2);
    gameState.items.forEach(it => ctx.fillText(it.s, it.x * t + t/2, it.y * t + t/2));
    gameState.vines.forEach(v => ctx.fillText(v.s, v.x * t + t/2, v.y * t + t/2));
    gameState.mobs.forEach(m => ctx.fillText(m.s, m.x * t + t/2, m.y * t + t/2));
    ctx.fillText("⚔️", gameState.player.x * t + t/2, gameState.player.y * t + t/2);
}

function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; draw(); }
window.addEventListener('resize', resize);
resize();
initLevel(1);