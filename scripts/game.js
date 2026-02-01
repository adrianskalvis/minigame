const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const diagBox = document.getElementById("dialogue-text");
const nextBtn = document.getElementById("next-diag-btn");
const backBtn = document.getElementById("back-diag-btn");
const hintBox = document.getElementById("pickup-hint");
const editor = document.getElementById("codeEditor");
const modal = document.getElementById("modal-overlay");

const COLS = 9, ROWS = 10;

let resourcesLoaded = false;
let loadedCount = 0;
const totalImages = Object.keys(sources).length;

function imgLoad() {
    for (let key in sources) {
        images[key] = new Image();
        images[key].src = sources[key];
        images[key].onload = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                resourcesLoaded = true;
                startAnimationLoop();
            }
        };
        images[key].onerror = () => {
            console.log("Image load failed: " + key);
        };
    }
}

function triggerFailSequence(msg) {
    if (gameState.lvl === 3) {
        draw();
        const flashOverlay = document.createElement("div");
        flashOverlay.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:black;z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;";
        const heartContainer = document.createElement("div");
        heartContainer.style = "display:flex;gap:10px;margin-bottom:20px;";
        const updateOverlayHearts = (types) => {
            heartContainer.innerHTML = "";
            types.forEach(type => {
                const h = new Image();
                h.src = sources[type];
                h.style.width = "64px";
                heartContainer.appendChild(h);
            });
        };
        const errorText = document.createElement("h1");
        errorText.innerText = "Ups!";
        errorText.style = "color:white;font-family:Arial;margin-bottom:20px;";
        flashOverlay.appendChild(errorText);
        flashOverlay.appendChild(heartContainer);
        document.body.appendChild(flashOverlay);
        updateOverlayHearts(["hFull", "hFull", "hHalf"]);
        let count = 0;
        const blink = setInterval(() => {
            if (count % 2 === 0) {
                updateOverlayHearts(["hEmpty", "hEmpty", "hEmpty"]);
            } else {
                updateOverlayHearts(["hFull", "hFull", "hHalf"]);
            }
            count++;
            if (count >= 7) {
                clearInterval(blink);
                updateOverlayHearts(["hEmpty", "hEmpty", "hEmpty"]);
                setTimeout(() => {
                    heartContainer.innerHTML = "<span style='font-size:100px;'>💔</span>";
                    setTimeout(() => {
                        document.body.removeChild(flashOverlay);
                        showModal("Ups!", msg, "MĒĢINĀT VĒLREIZ", () => { modal.style.display="none"; resetPlayer(); });
                    }, 1000);
                }, 1000);
            }
        }, 200);
    } else {
        showModal("Ups!", msg, "MĒĢINĀT VĒLREIZ", () => { modal.style.display="none"; resetPlayer(); });
    }
}

function initLevel(n) {
    modal.style.display = "none";
    gameState.isRunning = false;
    gameState.lvl = n;
    gameState.diagIdx = -1;
    gameState.player = { ...levels[n].start, sprite: 101 };
    gameState.startPos = { ...levels[n].start };
    gameState.items = JSON.parse(JSON.stringify(levels[n].items || []));
    gameState.inventory = [];
    gameState.hp = (n === 3) ? ["hFull", "hFull", "hHalf"] : ["hFull", "hHalf", "hEmpty"];
    gameState.mobs = JSON.parse(JSON.stringify(levels[n].mobs || []));
    gameState.vines = JSON.parse(JSON.stringify(levels[n].vines || []));
    gameState.goal = levels[n].goal;
    gameState.currentMap = levels[n].map ? JSON.parse(JSON.stringify(levels[n].map)) : Array(10).fill(0).map(() => Array(9).fill(0));
    editor.value = levels[n].placeholder;
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

function startAnimationLoop() {
    function loop() {
        draw();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function draw() {
    if (!canvas.width || !canvas.height) return;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const t = Math.min(canvas.width / COLS, canvas.height / ROWS);
    const offX = (canvas.width - t * COLS) / 2;
    const offY = (canvas.height - t * ROWS) / 2;

    ctx.save();
    ctx.translate(offX, offY);
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let tileID = gameState.currentMap[y]?.[x] ?? 0;
            if (!resourcesLoaded) continue;

            let bgID = tileID;
            if (gameState.lvl === 2) {
                if (tileID > 8 || tileID < 6) bgID = 6;
            } else if (gameState.lvl === 3) {
                if (tileID !== 0) {
                    const bg = TILE_TYPES[0];
                    ctx.drawImage(images[bg.img], bg.sx, bg.sy, bg.sw, bg.sh, x * t, y * t, t + 1, t + 1);
                }
            } else {
                if (tileID === 4 || tileID === 5 || tileID === 2) bgID = 0;
            }

            const base = TILE_TYPES[bgID];
            if (base && images[base.img]) {
                ctx.drawImage(images[base.img], base.sx, base.sy, base.sw, base.sh, x * t, y * t, t + 1, t + 1);
            }

            if (gameState.lvl === 1) {
                const left = gameState.currentMap[y]?.[x - 1];
                const right = gameState.currentMap[y]?.[x + 1];

                if (tileID === 2) {
                    const obj = TILE_TYPES[2];
                    ctx.drawImage(images[obj.img], obj.sx, obj.sy, obj.sw, obj.sh, x * t, y * t, t + 1, t + 1);
                }

                if (tileID !== 3) {
                    if (left === 3) ctx.drawImage(images.rocks, TILE_TYPES[32].sx, TILE_TYPES[32].sy, TILE_TYPES[32].sw, TILE_TYPES[32].sh, x * t, y * t, t / 2, t);
                    if (right === 3) ctx.drawImage(images.rocks, TILE_TYPES[31].sx, TILE_TYPES[31].sy, TILE_TYPES[31].sw, TILE_TYPES[31].sh, x * t + t / 2, y * t, t / 2, t);
                }

                if (bgID === 0) {
                    if (left === 2) ctx.drawImage(images.rocks, TILE_TYPES[22].sx, TILE_TYPES[22].sy, TILE_TYPES[22].sw, TILE_TYPES[22].sh, x * t, y * t, t / 2, t);
                    if (right === 2) ctx.drawImage(images.rocks, TILE_TYPES[21].sx, TILE_TYPES[21].sy, TILE_TYPES[21].sw, TILE_TYPES[21].sh, x * t + t / 2, y * t, t / 2, t);
                }
            }

            const layeredTiles = [18, 19, 20, 23, 24, 25, 26];
            if (layeredTiles.includes(tileID)) {
                if (tileID >= 24) {
                    const water = TILE_TYPES[8];
                    ctx.drawImage(images[water.img], water.sx, water.sy, water.sw, water.sh, x * t, y * t, t + 1, t + 1);
                }
                const patch = TILE_TYPES[tileID];
                ctx.drawImage(images[patch.img], patch.sx, patch.sy, patch.sw, patch.sh, x * t, y * t, t + 1, t + 1);
            }
        }
    }

    ctx.strokeStyle = "rgba(200, 200, 200, 0.4)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * t, 0); ctx.lineTo(x * t, ROWS * t); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * t); ctx.lineTo(COLS * t, y * t); ctx.stroke();
    }

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let tileID = gameState.currentMap[y]?.[x];
            const obj = TILE_TYPES[tileID];
            if (!obj) continue;

            if (tileID === 4 || tileID === 5) {
                ctx.drawImage(images[obj.img], obj.sx, obj.sy, obj.sw, obj.sh, x * t, (y - 0.5) * t, t * 2, t * 2);
            } else if (tileID === 60) {
                ctx.drawImage(images[obj.img], obj.sx, obj.sy, obj.sw, obj.sh, x * t, (y - 0.2) * t, t, t * 1.5);
            } else if (tileID >= 11 && tileID <= 17) {
                let w = t * 2, h = t * 2;
                if (tileID === 13 || tileID === 17) { w = t; h = t; }
                ctx.drawImage(images[obj.img], obj.sx, obj.sy, obj.sw, obj.sh, x * t - (w - t) / 2, y * t - (h - t), w, h);
            }
        }
    }

    const time = Date.now();

    const goalType = TILE_TYPES[gameState.goal.s];
    if (goalType && goalType.img && images[goalType.img]) {
        const bob = (gameState.goal.s === "300") ? Math.sin(time / 400) * (t * 0.04) : (gameState.goal.s === "400") ? Math.sin(time / 200) * (t * 0.04) : 0;
        ctx.drawImage(images[goalType.img], goalType.sx || 0, goalType.sy || 0, goalType.sw || images[goalType.img].width, goalType.sh || images[goalType.img].height, (gameState.goal.x * t) + (t * 0.15), (gameState.goal.y * t) + bob, t * 0.7, t);
    } else {
        ctx.font = `${t * 0.7}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(gameState.goal.s, gameState.goal.x * t + t/2, gameState.goal.y * t + t/2);
    }

    gameState.items.forEach(it => {
        if (it.s === "hFull" && images.hFull) {
            ctx.drawImage(images.hFull, it.x * t + t*0.2, it.y * t + t*0.2, t*0.6, t*0.6);
        } else {
            ctx.font = `${t * 0.6}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(it.s, it.x * t + t/2, it.y * t + t/2);
        }
    });

    gameState.vines.forEach(v => {
        const vi = TILE_TYPES[v.s];
        if (vi && images[vi.img]) {
            ctx.drawImage(images[vi.img], vi.sx, vi.sy, vi.sw, vi.sh, v.x * t, v.y * t, t, t);
        }
    });

    gameState.mobs.forEach(m => {
        const mobType = TILE_TYPES[m.s];
        if (mobType && images[mobType.img]) {
            const bob = (m.s === "200") ? Math.sin(time / 150) * (t * 0.1) : 0;
            ctx.drawImage(images[mobType.img], mobType.sx, mobType.sy, mobType.sw, mobType.sh, m.x * t, (m.y * t) + bob, t, t);
        }
    });

    const pSprite = TILE_TYPES[gameState.player.sprite];
    if(images.player && pSprite) {
        const pBob = Math.sin(time / 200) * (t * 0.05);
        ctx.drawImage(images.player, pSprite.sx, pSprite.sy, pSprite.sw, pSprite.sh, gameState.player.x * t, (gameState.player.y * t) + pBob, t, t);
    }

    const heartSize = t * 0.5;
    const padding = 10;
    gameState.hp.forEach((imgKey, index) => {
        if(images[imgKey]) {
            const hX = padding + index * (heartSize + 5);
            const hY = (ROWS * t) - heartSize - padding;
            ctx.drawImage(images[imgKey], hX, hY, heartSize, heartSize);
        }
    });

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
    nextBtn.style.visibility = (gameState.isTyping || gameState.diagIdx < list.length - 1) ? "visible" : "hidden";
    backBtn.style.visibility = (!gameState.isTyping && gameState.diagIdx > 0) ? "visible" : "hidden";
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
            showModal("Ups!", "Vai pieliki beigās semikolu ';' ? :)", "LABOT", () => { modal.style.display="none"; });
            return;
        }
        const cmd = rawLine.replace(";", "").toLowerCase();
        let nX = gameState.player.x, nY = gameState.player.y;
        let originalSprite = gameState.player.sprite;
        let actionSprite = originalSprite;

        if (cmd === "iet()") { nY--; actionSprite = 101; }
        else if (cmd === "ietatpakal()") { nY++; actionSprite = 100; }
        else if (cmd === "pakreisi()") { nX--; actionSprite = 103; }
        else if (cmd === "palabi()") { nX++; actionSprite = 102; }
        else if (cmd === "nemt()" || cmd === "panemt()") {
            const idx = gameState.items.findIndex(it => it.x === gameState.player.x && it.y === gameState.player.y);
            if (idx !== -1) {
                const item = gameState.items[idx];
                if (item.s === "hFull") gameState.hp = ["hFull", "hFull", "hHalf"];
                gameState.inventory.push(item);
                gameState.items.splice(idx, 1);
            }
        }
        else if (cmd === "zobens()") {
            const ghost = gameState.mobs[0];
            const dist = ghost ? Math.sqrt(Math.pow(gameState.player.x-ghost.x,2)+Math.pow(gameState.player.y-ghost.y,2)) : 100;
            if (dist < 1.5) {
                gameState.isRunning = false;
                triggerFailSequence("Gariņš tevi piebeidza duelī!");
                return;
            }
            gameState.vines = gameState.vines.filter(v => Math.abs(v.x-gameState.player.x)>1 || Math.abs(v.y-gameState.player.y)>1);
        }

        gameState.player.sprite = actionSprite;

        if (nX >= 0 && nX < COLS && nY >= 0 && nY < ROWS) {
            const tileID = gameState.currentMap[nY][nX];
            if (TILE_TYPES[tileID] && TILE_TYPES[tileID].walk !== false) {
                gameState.player.x = nX;
                gameState.player.y = nY;
            }
        }

        const hitMob = gameState.mobs.find(m => m.x === gameState.player.x && m.y === gameState.player.y);
        if(hitMob) {
            gameState.isRunning = false;
            triggerFailSequence("Gariņš tevi noķēra!");
            return;
        }

        const hitVine = gameState.vines.find(v => v.x === gameState.player.x && v.y === gameState.player.y);
        if(hitVine) {
            gameState.isRunning = false;
            triggerFailSequence("Tu sapinies liānās!");
            return;
        }

        checkLogic();
        await new Promise(r => setTimeout(r, 300));
        if (!gameState.isRunning) break;
        gameState.player.sprite = originalSprite;
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
            showModal("Urrā!", "Līmenis pabeigts!", "Doties tālāk", () => initLevel(gameState.lvl + 1));
        } else {
            showModal("Lieliski!", "Tu izglābi princesi ar loģiku!", "TĀLĀK", () => {
                showModal("UZVARA", "Tu kļuvi par koda meistaru un vari kļūt par programmētāju, apsveicam!", "SĀKT NO JAUNA", () => initLevel(1));
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
    gameState.isRunning = false;
    setTimeout(() => {
        gameState.player = { ...gameState.startPos, sprite: 101 };
        gameState.items = JSON.parse(JSON.stringify(levels[gameState.lvl].items || []));
        gameState.vines = JSON.parse(JSON.stringify(levels[gameState.lvl].vines || []));
        gameState.mobs = JSON.parse(JSON.stringify(levels[gameState.lvl].mobs || []));
        gameState.hp = (gameState.lvl === 3) ? ["hFull", "hFull", "hHalf"] : ["hFull", "hHalf", "hEmpty"];
        gameState.inventory = [];
        draw();
    }, 10);
}

window.addEventListener('resize', () => setTimeout(resize, 100));
imgLoad();
initLevel(1);