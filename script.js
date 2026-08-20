"use strict";


/* =========================================================
   ELEMENTOS
========================================================= */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

const video =
    document.getElementById("webcam");

const startScreen =
    document.getElementById("startScreen");

const countdownScreen =
    document.getElementById("countdownScreen");

const countdownNum =
    document.getElementById("countdownNum");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const camStatus =
    document.getElementById("camStatus");

const scoreValueEl =
    document.getElementById("scoreValue");

const bestInlineVal =
    document.getElementById("bestInlineVal");

const comboHUD =
    document.getElementById("comboHUD");

const finalScoreValueEl =
    document.getElementById("finalScoreValue");

const newBestTag =
    document.getElementById("newBestTag");

const statSliced =
    document.getElementById("statSliced");

const statCombo =
    document.getElementById("statCombo");

const statBombs =
    document.getElementById("statBombs");

const handHint =
    document.getElementById("handHint");

const timer =
    document.getElementById("timer");

const timerRing =
    document.getElementById("timerRing");

const timerNumber =
    document.getElementById("timerNumber");


/* =========================================================
   CANVAS
========================================================= */

let DPR =
    Math.min(window.devicePixelRatio || 1, 2);

let W = 0;
let H = 0;

function resize(){

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width =
        W * DPR;

    canvas.height =
        H * DPR;

    canvas.style.width =
        W + "px";

    canvas.style.height =
        H + "px";

    ctx.setTransform(
        DPR,
        0,
        0,
        DPR,
        0,
        0
    );
}

window.addEventListener(
    "resize",
    resize
);

resize();


/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

function getAudio(){

    if(!audioContext){

        try{

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }catch(e){}

    }

    return audioContext;
}


function beep({
    freq=440,
    dur=.1,
    type="sine",
    gain=.12,
    slideTo=null
}={}){

    const ac =
        getAudio();

    if(!ac)
        return;

    const now =
        ac.currentTime;

    const osc =
        ac.createOscillator();

    const gainNode =
        ac.createGain();

    osc.type =
        type;

    osc.frequency.setValueAtTime(
        freq,
        now
    );

    if(slideTo){

        osc.frequency.exponentialRampToValueAtTime(
            Math.max(20,slideTo),
            now + dur
        );

    }

    gainNode.gain.setValueAtTime(
        .0001,
        now
    );

    gainNode.gain.exponentialRampToValueAtTime(
        gain,
        now + .01
    );

    gainNode.gain.exponentialRampToValueAtTime(
        .0001,
        now + dur
    );

    osc.connect(gainNode);
    gainNode.connect(ac.destination);

    osc.start(now);
    osc.stop(now + dur + .03);
}


function sfxSlice(){

    beep({
        freq:900 + Math.random()*400,
        slideTo:180,
        dur:.13,
        type:"sawtooth",
        gain:.07
    });

}


function sfxCombo(){

    beep({
        freq:900,
        slideTo:1700,
        dur:.18,
        type:"triangle",
        gain:.09
    });

}


function sfxBomb(){

    beep({
        freq:110,
        slideTo:30,
        dur:.45,
        type:"sawtooth",
        gain:.18
    });

    beep({
        freq:70,
        slideTo:20,
        dur:.55,
        type:"square",
        gain:.12
    });

}


function sfxStart(){

    beep({
        freq:280,
        slideTo:900,
        dur:.25,
        type:"triangle",
        gain:.08
    });

}


function sfxTick(){

    beep({
        freq:650,
        dur:.06,
        type:"square",
        gain:.05
    });

}


/* =========================================================
   STATE
========================================================= */

const STATE = {

    MENU:"MENU",

    COUNTDOWN:"COUNTDOWN",

    PLAYING:"PLAYING",

    RESULTS:"RESULTS"

};

let state =
    STATE.MENU;


const ROUND_SECONDS = 20;

let timeLeft =
    ROUND_SECONDS;

let lastTickSecond =
    ROUND_SECONDS;


let score = 0;

let bestScore =
    Number(
        localStorage.getItem(
            "fruitSlashBest"
        ) || 0
    );


let comboCount = 0;

let bestCombo = 0;

let lastSliceTime = 0;

const COMBO_WINDOW =
    700;

let slicedCount = 0;

let bombHits = 0;


let fruits = [];

let pieces = [];

let particles = [];

let popups = [];


let spawnTimer = 0;

let elapsedPlay = 0;


/* =========================================================
   PHYSICS
========================================================= */

const GRAVITY = 1500;


/* =========================================================
   FRUIT TYPES
========================================================= */

const FRUIT_TYPES = [

    {
        emoji:"🍉",
        name:"watermelon",
        pts:10
    },

    {
        emoji:"🍊",
        name:"orange",
        pts:10
    },

    {
        emoji:"🍎",
        name:"apple",
        pts:12
    },

    {
        emoji:"🍋",
        name:"lemon",
        pts:12
    },

    {
        emoji:"🍍",
        name:"pineapple",
        pts:15
    },

    {
        emoji:"🥝",
        name:"kiwi",
        pts:15
    },

    {
        emoji:"🍓",
        name:"strawberry",
        pts:18
    },

    {
        emoji:"🥭",
        name:"mango",
        pts:18
    },

    {
        emoji:"🍑",
        name:"peach",
        pts:20
    },

    {
        emoji:"🍇",
        name:"grape",
        pts:20
    }

];


function rand(a,b){

    return a +
        Math.random() *
        (b-a);

}


function pick(arr){

    return arr[
        Math.floor(
            Math.random() *
            arr.length
        )
    ];

}


/* =========================================================
   FRUIT
========================================================= */

class Fruit{

    constructor(isBomb){

        this.isBomb =
            Boolean(isBomb);

        this.def =
            this.isBomb
                ? null
                : pick(FRUIT_TYPES);


        this.radius =
            this.isBomb
                ? rand(34,44)
                : rand(31,47);


        /*
         * LANÇAMENTO MAIS ALTO
         *
         * Antes:
         * 820 - 1020
         *
         * Agora:
         * 1450 - 1750
         */

        const launchSpeed =
            rand(1450,1750) *
            (H / 1000);


        /*
         * Mais movimento lateral
         */

        this.x =
            rand(
                W * .12,
                W * .88
            );


        this.y =
            H +
            this.radius +
            30;


        this.vx =
            rand(-240,240);


        /*
         * impulso vertical
         */

        this.vy =
            -launchSpeed;


        this.rotation =
            rand(
                0,
                Math.PI * 2
            );


        this.rotSpeed =
            rand(
                -3.5,
                3.5
            );


        this.sliced =
            false;

        this.missed =
            false;

    }


    update(dt){

        this.vy +=
            GRAVITY * dt;

        this.x +=
            this.vx * dt;

        this.y +=
            this.vy * dt;

        this.rotation +=
            this.rotSpeed * dt;


        /*
         * Rebote lateral suave
         */

        if(
            this.x <
            this.radius
        ){

            this.x =
                this.radius;

            this.vx =
                Math.abs(this.vx);

        }


        if(
            this.x >
            W - this.radius
        ){

            this.x =
                W - this.radius;

            this.vx =
                -Math.abs(this.vx);

        }

    }


    get offscreen(){

        return (
            this.y -
            this.radius >
            H + 80
        );

    }


    draw(){

        ctx.save();

        ctx.translate(
            this.x,
            this.y
        );

        ctx.rotate(
            this.rotation
        );


        if(this.isBomb){

            drawBomb(
                this.radius
            );

        }else{

            drawEmojiFruit(
                this.def.emoji,
                this.radius
            );

        }

        ctx.restore();

    }

}


/* =========================================================
   EMOJI FRUIT
========================================================= */

function drawEmojiFruit(
    emoji,
    radius
){

    ctx.save();

    const size =
        radius * 2.05;


    /*
     * Aura neon
     */

    ctx.shadowColor =
        "#00f6ff";

    ctx.shadowBlur =
        25;


    /*
     * brilho circular atrás
     */

    ctx.globalAlpha =
        .18;

    ctx.fillStyle =
        "#00f6ff";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        radius * 1.08,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.globalAlpha =
        1;


    ctx.font =
        `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillText(
        emoji,
        0,
        3
    );


    /*
     * contorno energético
     */

    ctx.shadowColor =
        "#8b4dff";

    ctx.shadowBlur =
        12;


    ctx.strokeStyle =
        "rgba(255,255,255,.25)";

    ctx.lineWidth =
        1.5;


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        radius * .9,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    ctx.restore();

}


/* =========================================================
   BOMB
========================================================= */

function drawBomb(r){

    ctx.save();

    ctx.shadowColor =
        "#ff304f";

    ctx.shadowBlur =
        30;


    const gradient =
        ctx.createRadialGradient(
            -r*.3,
            -r*.35,
            r*.1,
            0,
            0,
            r
        );


    gradient.addColorStop(
        0,
        "#444"
    );

    gradient.addColorStop(
        .45,
        "#111"
    );

    gradient.addColorStop(
        1,
        "#000"
    );


    ctx.fillStyle =
        gradient;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        r,
        0,
        Math.PI*2
    );

    ctx.fill();


    ctx.lineWidth =
        3;

    ctx.strokeStyle =
        "#ff304f";

    ctx.stroke();


    /*
     * símbolo proibido
     * substituído por X para evitar aparência ambígua
     */

    ctx.strokeStyle =
        "#ff4058";

    ctx.lineWidth =
        4;

    ctx.beginPath();

    ctx.moveTo(
        -r*.35,
        -r*.35
    );

    ctx.lineTo(
        r*.35,
        r*.35
    );

    ctx.moveTo(
        r*.35,
        -r*.35
    );

    ctx.lineTo(
        -r*.35,
        r*.35
    );

    ctx.stroke();


    /*
     * faísca
     */

    ctx.strokeStyle =
        "#ffe45c";

    ctx.lineWidth =
        2;

    ctx.beginPath();

    ctx.moveTo(
        r*.25,
        -r*.85
    );

    ctx.lineTo(
        r*.45,
        -r*1.1
    );

    ctx.lineTo(
        r*.62,
        -r*.9
    );

    ctx.stroke();


    ctx.restore();

}


/* =========================================================
   PIECES
========================================================= */

class Piece{

    constructor(
        fruit,
        side,
        sliceAngle
    ){

        this.fruit =
            fruit;

        this.side =
            side;

        this.x =
            fruit.x;

        this.y =
            fruit.y;

        this.r =
            fruit.radius;

        this.rotation =
            fruit.rotation;

        this.rotSpeed =
            fruit.rotSpeed +
            side * rand(2,4);

        this.sliceAngle =
            sliceAngle;


        const perp =
            sliceAngle +
            Math.PI/2;


        const sep =
            rand(
                150,
                240
            );


        this.vx =
            fruit.vx +
            Math.cos(perp) *
            sep *
            side +
            rand(-50,50);


        this.vy =
            fruit.vy +
            Math.sin(perp) *
            sep *
            side -
            rand(40,100);


        this.life =
            1;

    }


    update(dt){

        this.vy +=
            GRAVITY *
            dt;

        this.x +=
            this.vx *
            dt;

        this.y +=
            this.vy *
            dt;

        this.rotation +=
            this.rotSpeed *
            dt;

        this.life -=
            dt * .65;

    }


    draw(){

        if(
            this.life <= 0
        )
            return;


        ctx.save();

        ctx.globalAlpha =
            Math.max(
                0,
                this.life
            );

        ctx.translate(
            this.x,
            this.y
        );

        ctx.rotate(
            this.rotation
        );


        /*
         * metade visual da fruta
         */

        ctx.beginPath();

        const a0 =
            this.sliceAngle +
            (
                this.side > 0
                    ? 0
                    : Math.PI
            );


        ctx.moveTo(
            0,
            0
        );

        ctx.arc(
            0,
            0,
            this.r,
            a0,
            a0 + Math.PI
        );

        ctx.closePath();


        ctx.font =
            `${this.r*2}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.shadowColor =
            "#00f6ff";

        ctx.shadowBlur =
            15;


        ctx.fillStyle =
            "#ffffff";

        ctx.fill();


        ctx.restore();

    }

}


/* =========================================================
   PARTICLES
========================================================= */

class Particle{

    constructor(
        x,
        y,
        color,
        opts={}
    ){

        this.x =
            x;

        this.y =
            y;


        const angle =
            opts.angle !== undefined
                ? opts.angle
                : rand(
                    0,
                    Math.PI*2
                );


        const speed =
            opts.speed !== undefined
                ? opts.speed
                : rand(
                    70,
                    350
                );


        this.vx =
            Math.cos(angle) *
            speed;

        this.vy =
            Math.sin(angle) *
            speed;


        this.color =
            color;


        this.r =
            opts.r ||
            rand(2,5);


        this.life =
            1;


        this.decay =
            opts.decay ||
            rand(.8,1.6);


        this.gravity =
            opts.gravity !== undefined
                ? opts.gravity
                : 500;

    }


    update(dt){

        this.vy +=
            this.gravity *
            dt;

        this.x +=
            this.vx *
            dt;

        this.y +=
            this.vy *
            dt;

        this.life -=
            this.decay *
            dt;

    }


    draw(){

        if(
            this.life <= 0
        )
            return;


        ctx.save();

        ctx.globalAlpha =
            Math.max(
                0,
                this.life
            );

        ctx.fillStyle =
            this.color;

        ctx.shadowColor =
            this.color;

        ctx.shadowBlur =
            12;


        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.r,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.restore();

    }

}


function burst(
    x,
    y,
    color,
    count=20,
    opts={}
){

    for(
        let i=0;
        i<count;
        i++
    ){

        particles.push(
            new Particle(
                x,
                y,
                color,
                opts
            )
        );

    }

}


/* =========================================================
   POPUPS
========================================================= */

class Popup{

    constructor(
        x,
        y,
        text,
        color
    ){

        this.x=x;
        this.y=y;
        this.text=text;
        this.color=color;

        this.life=1;

        this.vy=-75;

    }


    update(dt){

        this.y +=
            this.vy *
            dt;

        this.life -=
            dt * .9;

    }


    draw(){

        if(
            this.life <= 0
        )
            return;


        ctx.save();

        ctx.globalAlpha =
            Math.max(
                0,
                this.life
            );

        ctx.font =
            '800 22px "Orbitron", sans-serif';

        ctx.fillStyle =
            this.color;

        ctx.shadowColor =
            this.color;

        ctx.shadowBlur =
            15;

        ctx.textAlign =
            "center";


        ctx.fillText(
            this.text,
            this.x,
            this.y
        );


        ctx.restore();

    }

}


/* =========================================================
   HAND TRACKING
   NÃO ALTERADO NO CONCEITO
========================================================= */

const trail = [];

const TRAIL_MAX_AGE =
    150;


let bladePos =
    null;

let bladeSmooth =
    null;

let handDetected =
    false;

let lastHandSeenAt =
    0;

let handLandmarksNorm =
    null;

let reticleSpin =
    0;


const HAND_CONNECTIONS = [

    [0,1],
    [1,2],
    [2,3],
    [3,4],

    [0,5],
    [5,6],
    [6,7],
    [7,8],

    [5,9],
    [9,10],
    [10,11],
    [11,12],

    [9,13],
    [13,14],
    [14,15],
    [15,16],

    [13,17],
    [17,18],
    [18,19],
    [19,20],

    [0,17]

];


function addTrailPoint(
    x,
    y
){

    const now =
        performance.now();

    trail.push({
        x,
        y,
        t:now
    });


    while(
        trail.length &&
        now -
        trail[0].t >
        TRAIL_MAX_AGE
    ){

        trail.shift();

    }

}


/* =========================================================
   DISTÂNCIA
========================================================= */

function pointSegDist(
    px,
    py,
    x1,
    y1,
    x2,
    y2
){

    const dx =
        x2-x1;

    const dy =
        y2-y1;

    const lenSq =
        dx*dx +
        dy*dy;


    let t =
        lenSq > 0
            ? (
                (
                    (px-x1)*dx +
                    (py-y1)*dy
                ) /
                lenSq
            )
            : 0;


    t =
        Math.max(
            0,
            Math.min(
                1,
                t
            )
        );


    const cx =
        x1 +
        t*dx;

    const cy =
        y1 +
        t*dy;


    return Math.hypot(
        px-cx,
        py-cy
    );

}


/* =========================================================
   SLICE DETECTION
========================================================= */

function checkSlices(){

    if(
        trail.length < 2
    )
        return;


    const now =
        performance.now();


    for(
        let i=1;
        i<trail.length;
        i++
    ){

        const p0 =
            trail[i-1];

        const p1 =
            trail[i];


        if(
            now -
            p1.t >
            TRAIL_MAX_AGE
        )
            continue;


        const dt =
            Math.max(
                1,
                p1.t-p0.t
            ) / 1000;


        const segLen =
            Math.hypot(
                p1.x-p0.x,
                p1.y-p0.y
            );


        const speed =
            segLen / dt;


        /*
         * Lâmina continua responsiva.
         */

        if(
            speed < 190
        )
            continue;


        const angle =
            Math.atan2(
                p1.y-p0.y,
                p1.x-p0.x
            );


        for(
            const f of fruits
        ){

            if(
                f.sliced
            )
                continue;


            const distance =
                pointSegDist(
                    f.x,
                    f.y,
                    p0.x,
                    p0.y,
                    p1.x,
                    p1.y
                );


            if(
                distance <
                f.radius + 18
            ){

                sliceFruit(
                    f,
                    angle
                );

            }

        }

    }

}


/* =========================================================
   SLICE
========================================================= */

function sliceFruit(
    f,
    angle
){

    f.sliced =
        true;


    if(
        f.isBomb
    ){

        triggerBombHit(f);

        return;

    }


    pieces.push(
        new Piece(
            f,
            -1,
            angle
        )
    );

    pieces.push(
        new Piece(
            f,
            1,
            angle
        )
    );


    burst(
        f.x,
        f.y,
        "#00f6ff",
        22,
        {
            speed:rand(100,350)
        }
    );


    burst(
        f.x,
        f.y,
        "#ffffff",
        7,
        {
            speed:rand(50,170),
            r:2,
            decay:2
        }
    );


    slicedCount++;


    const now =
        performance.now();


    if(
        now -
        lastSliceTime <
        COMBO_WINDOW
    ){

        comboCount++;

    }else{

        comboCount = 1;

    }


    lastSliceTime =
        now;


    if(
        comboCount >
        bestCombo
    ){

        bestCombo =
            comboCount;

    }


    let multiplier =
        1;


    if(
        comboCount >= 2
    ){

        multiplier =
            1 +
            (
                comboCount-1
            ) * .5;


        showCombo(
            comboCount
        );


        sfxCombo();

    }else{

        sfxSlice();

    }


    const gained =
        Math.round(
            f.def.pts *
            multiplier
        );


    score +=
        gained;


    scoreValueEl.textContent =
        score;


    popups.push(
        new Popup(
            f.x,
            f.y-10,
            "+" + gained,
            "#00f6ff"
        )
    );

}


/* =========================================================
   COMBO
========================================================= */

function showCombo(n){

    comboHUD.textContent =
        "COMBO x" + n;

    comboHUD.classList.add(
        "show"
    );


    clearTimeout(
        showCombo.timer
    );


    showCombo.timer =
        setTimeout(
            ()=>{
                comboHUD.classList.remove(
                    "show"
                );
            },
            750
        );

}


/* =========================================================
   BOMB
========================================================= */

function triggerBombHit(f){

    sfxBomb();

    bombHits++;


    score =
        Math.max(
            0,
            score-15
        );


    scoreValueEl.textContent =
        score;


    timeLeft =
        Math.max(
            0,
            timeLeft-1.5
        );


    comboCount =
        0;


    burst(
        f.x,
        f.y,
        "#ff304f",
        45,
        {
            speed:rand(180,500),
            r:4,
            decay:.8
        }
    );


    burst(
        f.x,
        f.y,
        "#ffe45c",
        20,
        {
            speed:rand(120,320),
            r:3,
            decay:1.1
        }
    );


    popups.push(
        new Popup(
            f.x,
            f.y-10,
            "-15",
            "#ff304f"
        )
    );


    screenShake =
        22;

    flashRed =
        1;

}


/* =========================================================
   SPAWN
========================================================= */

function spawnWave(){

    const bombChance =
        Math.min(
            .08 +
            elapsedPlay/40000,
            .20
        );


    const random =
        Math.random();


    const count =
        random < .30
            ? 2
            : random < .10
                ? 3
                : 1;


    for(
        let i=0;
        i<count;
        i++
    ){

        setTimeout(
            ()=>{

                if(
                    state !==
                    STATE.PLAYING
                )
                    return;


                fruits.push(
                    new Fruit(
                        Math.random() <
                        bombChance
                    )
                );

            },
            i * 130
        );

    }

}


/* =========================================================
   CAMERA VISOR
========================================================= */

let scanOffset =
    0;


function drawVisorBackground(
    dt
){

    ctx.save();


    const ready =
        video.readyState >= 2 &&
        video.videoWidth > 0;


    if(ready){

        const vw =
            video.videoWidth;

        const vh =
            video.videoHeight;


        const scale =
            Math.max(
                W/vw,
                H/vh
            );


        const dw =
            vw * scale;

        const dh =
            vh * scale;


        const dx =
            (W-dw)/2;

        const dy =
            (H-dh)/2;


        /*
         * câmera continua como visor
         */

        ctx.filter =
            "saturate(.38) brightness(.48) contrast(1.18) hue-rotate(210deg)";


        ctx.translate(
            W,
            0
        );

        ctx.scale(
            -1,
            1
        );


        ctx.drawImage(
            video,
            W-dx-dw,
            dy,
            dw,
            dh
        );


        ctx.setTransform(
            DPR,
            0,
            0,
            DPR,
            0,
            0
        );


        ctx.filter =
            "none";


        /*
         * overlay neon
         */

        const tint =
            ctx.createLinearGradient(
                0,
                0,
                0,
                H
            );


        tint.addColorStop(
            0,
            "rgba(0,20,55,.30)"
        );

        tint.addColorStop(
            .5,
            "rgba(20,0,60,.18)"
        );

        tint.addColorStop(
            1,
            "rgba(30,0,30,.45)"
        );


        ctx.fillStyle =
            tint;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );

    }else{

        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                0,
                H
            );


        gradient.addColorStop(
            0,
            "#020716"
        );

        gradient.addColorStop(
            1,
            "#0d0318"
        );


        ctx.fillStyle =
            gradient;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );

    }


    /*
     * scanlines
     */

    scanOffset =
        (
            scanOffset +
            dt * 35
        ) % 6;


    ctx.strokeStyle =
        "rgba(0,246,255,.035)";

    ctx.lineWidth =
        1;


    ctx.beginPath();


    for(
        let y=scanOffset;
        y<H;
        y+=6
    ){

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            W,
            y
        );

    }


    ctx.stroke();


    /*
     * grid neon discreta
     */

    ctx.strokeStyle =
        "rgba(139,77,255,.045)";

    const grid =
        70;


    ctx.beginPath();


    for(
        let x=0;
        x<W;
        x+=grid
    ){

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            H
        );

    }


    for(
        let y=0;
        y<H;
        y+=grid
    ){

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            W,
            y
        );

    }


    ctx.stroke();


    /*
     * vignette
     */

    const vignette =
        ctx.createRadialGradient(
            W/2,
            H/2,
            H*.25,
            W/2,
            H/2,
            H*.9
        );


    vignette.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
        1,
        "rgba(0,0,8,.72)"
    );


    ctx.fillStyle =
        vignette;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    ctx.restore();

}


/* =========================================================
   TRAIL
========================================================= */

function drawTrail(){

    if(
        trail.length < 2
    )
        return;


    const now =
        performance.now();


    ctx.save();

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";


    for(
        let i=1;
        i<trail.length;
        i++
    ){

        const p0 =
            trail[i-1];

        const p1 =
            trail[i];


        const age =
            (
                now -
                p1.t
            ) /
            TRAIL_MAX_AGE;


        if(
            age > 1
        )
            continue;


        const alpha =
            1-age;


        const width =
            12 * alpha + 2;


        /*
         * mesma ideia da lâmina original:
         * violeta -> ciano
         */

        const t =
            i /
            trail.length;


        const col =
            mixColor(
                [139,77,255],
                [0,246,255],
                t
            );


        ctx.strokeStyle =
            `rgba(
                ${col[0]},
                ${col[1]},
                ${col[2]},
                ${alpha*.95}
            )`;


        ctx.shadowColor =
            `rgba(
                ${col[0]},
                ${col[1]},
                ${col[2]},
                ${alpha}
            )`;


        ctx.shadowBlur =
            25 * alpha;


        ctx.lineWidth =
            width;


        ctx.beginPath();

        ctx.moveTo(
            p0.x,
            p0.y
        );

        ctx.lineTo(
            p1.x,
            p1.y
        );

        ctx.stroke();

    }


    /*
     * núcleo branco da lâmina
     */

    if(
        trail.length > 2
    ){

        const p =
            trail[
                trail.length-1
            ];


        ctx.shadowColor =
            "#ffffff";

        ctx.shadowBlur =
            14;

        ctx.strokeStyle =
            `rgba(
                255,
                255,
                255,
                .75
            )`;

        ctx.lineWidth =
            2;


        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            3,
            0,
            Math.PI*2
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* =========================================================
   COLOR MIX
========================================================= */

function mixColor(
    a,
    b,
    t
){

    return [

        Math.round(
            a[0] +
            (b[0]-a[0]) *
            t
        ),

        Math.round(
            a[1] +
            (b[1]-a[1]) *
            t
        ),

        Math.round(
            a[2] +
            (b[2]-a[2]) *
            t
        )

    ];

}


/* =========================================================
   RETÍCULO DO INDICADOR
   PRESERVADO
========================================================= */

function drawReticle(dt){

    if(
        !bladePos
    )
        return;


    if(
        !bladeSmooth
    ){

        bladeSmooth = {

            x:bladePos.x,

            y:bladePos.y

        };

    }


    /*
     * responsividade maior
     */

    bladeSmooth.x +=
        (
            bladePos.x -
            bladeSmooth.x
        ) * .68;


    bladeSmooth.y +=
        (
            bladePos.y -
            bladeSmooth.y
        ) * .68;


    reticleSpin +=
        dt *
        (
            handDetected
                ? 2.2
                : .4
        );


    const active =
        performance.now() -
        lastHandSeenAt <
        400;


    const col =
        active
            ? "#00f6ff"
            : "rgba(0,246,255,.3)";


    ctx.save();


    ctx.translate(
        bladeSmooth.x,
        bladeSmooth.y
    );


    ctx.strokeStyle =
        col;


    ctx.shadowColor =
        "#8b4dff";


    ctx.shadowBlur =
        active
            ? 22
            : 7;


    ctx.lineWidth =
        1.6;


    /*
     * círculo principal
     */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        20,
        0,
        Math.PI*2
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        29,
        0,
        Math.PI*2
    );

    ctx.stroke();


    /*
     * quatro marcas
     */

    ctx.rotate(
        reticleSpin
    );


    for(
        let i=0;
        i<4;
        i++
    ){

        const a =
            i *
            Math.PI/2;


        ctx.beginPath();

        ctx.moveTo(
            Math.cos(a)*33,
            Math.sin(a)*33
        );

        ctx.lineTo(
            Math.cos(a)*42,
            Math.sin(a)*42
        );

        ctx.stroke();

    }


    ctx.rotate(
        -reticleSpin
    );


    /*
     * bola central
     */

    ctx.fillStyle =
        "#ffffff";

    ctx.shadowColor =
        "#00f6ff";

    ctx.shadowBlur =
        20;


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        4,
        0,
        Math.PI*2
    );

    ctx.fill();


    ctx.restore();

}


/* =========================================================
   HAND SKELETON
========================================================= */

function drawHandSkeleton(){

    const pts =
        handLandmarksNorm.map(
            l => ({

                x:(1-l.x)*W,

                y:l.y*H

            })
        );


    ctx.save();


    ctx.strokeStyle =
        "rgba(139,77,255,.45)";


    ctx.lineWidth =
        1.6;


    ctx.shadowColor =
        "#8b4dff";


    ctx.shadowBlur =
        10;


    ctx.beginPath();


    for(
        const [a,b]
        of HAND_CONNECTIONS
    ){

        ctx.moveTo(
            pts[a].x,
            pts[a].y
        );

        ctx.lineTo(
            pts[b].x,
            pts[b].y
        );

    }


    ctx.stroke();


    ctx.fillStyle =
        "rgba(0,246,255,.75)";


    for(
        const p
        of pts
    ){

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            2.3,
            0,
            Math.PI*2
        );

        ctx.fill();

    }


    ctx.restore();

}


/* =========================================================
   TIMER UI
========================================================= */

const RING_CIRC =
    2 *
    Math.PI *
    43;


timerRing.setAttribute(
    "stroke-dasharray",
    RING_CIRC.toFixed(1)
);


function updateTimerUI(){

    const frac =
        Math.max(
            0,
            timeLeft /
            ROUND_SECONDS
        );


    timerRing.setAttribute(
        "stroke-dashoffset",
        (
            RING_CIRC *
            (1-frac)
        ).toFixed(1)
    );


    timerNumber.textContent =
        Math.ceil(
            timeLeft
        );


    timer.classList.toggle(
        "low",
        timeLeft <= 5
    );

}


/* =========================================================
   RESET
========================================================= */

function resetRound(){

    score = 0;

    comboCount = 0;

    bestCombo = 0;

    slicedCount = 0;

    bombHits = 0;


    fruits = [];

    pieces = [];

    particles = [];

    popups = [];


    spawnTimer = 0;

    elapsedPlay = 0;


    trail.length = 0;


    screenShake = 0;

    flashRed = 0;


    timeLeft =
        ROUND_SECONDS;


    lastTickSecond =
        ROUND_SECONDS;


    scoreValueEl.textContent =
        "0";


    bestInlineVal.textContent =
        bestScore;


    updateTimerUI();

}


/* =========================================================
   COUNTDOWN
========================================================= */

function startCountdown(){

    resetRound();


    state =
        STATE.COUNTDOWN;


    countdownScreen.classList.remove(
        "hidden"
    );


    let n = 3;


    countdownNum.textContent =
        n;


    sfxStart();


    const interval =
        setInterval(
            ()=>{

                n--;


                if(
                    n > 0
                ){

                    countdownNum.textContent =
                        n;

                    countdownNum.style.animation =
                        "none";

                    void countdownNum.offsetWidth;

                    countdownNum.style.animation =
                        "countPop .7s ease";

                    sfxStart();

                }else{

                    clearInterval(
                        interval
                    );


                    countdownNum.textContent =
                        "VAI!";


                    setTimeout(
                        ()=>{

                            countdownScreen.classList.add(
                                "hidden"
                            );


                            state =
                                STATE.PLAYING;


                            sfxStart();

                        },
                        420
                    );

                }

            },
            700
        );

}


/* =========================================================
   END ROUND
========================================================= */

function endRound(){

    if(
        state ===
        STATE.RESULTS
    )
        return;


    state =
        STATE.RESULTS;


    const isNewBest =
        score >
        bestScore;


    if(
        isNewBest
    ){

        bestScore =
            score;


        localStorage.setItem(
            "fruitSlashBest",
            bestScore
        );

    }


    finalScoreValueEl.textContent =
        score;


    bestInlineVal.textContent =
        bestScore;


    newBestTag.classList.toggle(
        "show",
        isNewBest
    );


    statSliced.textContent =
        slicedCount;


    statCombo.textContent =
        "x" + bestCombo;


    statBombs.textContent =
        bombHits;


    fruits = [];


    setTimeout(
        ()=>{
            gameOverScreen.classList.remove(
                "hidden"
            );
        },
        450
    );

}


/* =========================================================
   MAIN LOOP
========================================================= */

let lastT =
    performance.now();


let screenShake =
    0;

let flashRed =
    0;


function gameLoop(t){

    const dt =
        Math.min(
            .033,
            (t-lastT)/1000
        );


    lastT =
        t;


    drawVisorBackground(
        dt
    );


    ctx.save();


    /*
     * screen shake
     */

    if(
        screenShake > 0
    ){

        ctx.translate(
            (
                Math.random()-.5
            ) *
            screenShake,

            (
                Math.random()-.5
            ) *
            screenShake
        );


        screenShake *=
            .84;


        if(
            screenShake < .5
        ){

            screenShake = 0;

        }

    }


    /* =====================================================
       GAME
    ====================================================== */

    if(
        state ===
        STATE.PLAYING
    ){

        elapsedPlay +=
            dt * 1000;


        spawnTimer +=
            dt * 1000;


        /*
         * mais velocidade conforme o tempo passa
         */

        const curInterval =
            Math.max(
                330,
                850 -
                elapsedPlay*.026
            );


        if(
            spawnTimer >
            curInterval
        ){

            spawnTimer = 0;

            spawnWave();

        }


        /*
         * atualizar frutas
         */

        for(
            const f of fruits
        ){

            if(
                !f.sliced
            ){

                f.update(dt);

            }

        }


        /*
         * frutas perdidas
         */

        for(
            const f of fruits
        ){

            if(
                !f.sliced &&
                !f.missed &&
                f.offscreen
            ){

                f.missed =
                    true;


                if(
                    !f.isBomb
                ){

                    comboCount =
                        0;

                }

            }

        }


        fruits =
            fruits.filter(
                f =>
                    !f.offscreen &&
                    !f.sliced
            );


        /*
         * detectar corte
         */

        checkSlices();


        /*
         * tempo
         */

        timeLeft -=
            dt;


        if(
            timeLeft <= 0
        ){

            timeLeft = 0;

            endRound();

        }


        updateTimerUI();


        /*
         * tick final
         */

        const sec =
            Math.ceil(
                timeLeft
            );


        if(
            sec !==
            lastTickSecond
        ){

            lastTickSecond =
                sec;


            if(
                sec <= 5 &&
                sec > 0
            ){

                sfxTick();

            }

        }


        /*
         * aviso de mão
         */

        if(
            performance.now() -
            lastHandSeenAt >
            1400
        ){

            handHint.classList.add(
                "show"
            );

        }else{

            handHint.classList.remove(
                "show"
            );

        }

    }


    /* =====================================================
       EFFECTS
    ====================================================== */

    for(
        const p of pieces
    ){

        p.update(dt);

    }


    pieces =
        pieces.filter(
            p =>
                p.life > 0 &&
                p.y < H+250
        );


    for(
        const p of particles
    ){

        p.update(dt);

    }


    particles =
        particles.filter(
            p =>
                p.life > 0
        );


    for(
        const p of popups
    ){

        p.update(dt);

    }


    popups =
        popups.filter(
            p =>
                p.life > 0
        );


    /* =====================================================
       DRAW OBJECTS
    ====================================================== */

    for(
        const f of fruits
    ){

        if(
            !f.sliced
        ){

            f.draw();

        }

    }


    for(
        const p of pieces
    ){

        p.draw();

    }


    for(
        const p of particles
    ){

        p.draw();

    }


    for(
        const p of popups
    ){

        p.draw();

    }


    /*
     * rastro da mão
     */

    drawTrail();


    /*
     * esqueleto da mão
     */

    if(
        handLandmarksNorm &&
        (
            state === STATE.PLAYING ||
            state === STATE.COUNTDOWN
        )
    ){

        drawHandSkeleton();

    }


    /*
     * bola/retículo do indicador
     */

    drawReticle(dt);


    ctx.restore();


    /*
     * flash da bomba
     */

    if(
        flashRed > 0
    ){

        ctx.save();

        ctx.fillStyle =
            `rgba(
                255,
                48,
                79,
                ${flashRed*.3}
            )`;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );

        ctx.restore();


        flashRed -=
            dt*2;


        if(
            flashRed < 0
        ){

            flashRed = 0;

        }

    }


    requestAnimationFrame(
        gameLoop
    );

}


requestAnimationFrame(
    gameLoop
);


/* =========================================================
   MEDIAPIPE
========================================================= */

let handsInstance =
    null;

let cameraUtilInstance =
    null;


function onHandResults(
    results
){

    if(
        results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0
    ){

        const lm =
            results.multiHandLandmarks[0];


        /*
         * Mantido:
         * mapa da mão + indicador
         */

        handLandmarksNorm =
            lm;


        handDetected =
            true;


        lastHandSeenAt =
            performance.now();


        const tip =
            lm[8];


        const x =
            (1-tip.x) *
            W;


        const y =
            tip.y *
            H;


        bladePos = {
            x,
            y
        };


        addTrailPoint(
            x,
            y
        );

    }else{

        handDetected =
            false;

    }

}


/* =========================================================
   CAMERA INIT
========================================================= */

async function initHandTracking(){

    camStatus.textContent =
        "SOLICITANDO ACESSO À CÂMERA...";


    camStatus.className =
        "";


    try{

        const stream =
            await navigator.mediaDevices.getUserMedia({

                video:{
                    facingMode:"user",

                    width:{
                        ideal:640
                    },

                    height:{
                        ideal:480
                    }

                },

                audio:false

            });


        video.srcObject =
            stream;


        await video.play().catch(
            ()=>{}
        );


    }catch(err){

        camStatus.textContent =
            "CÂMERA NÃO AUTORIZADA. VERIFIQUE AS PERMISSÕES.";

        camStatus.className =
            "err";


        return false;

    }


    if(
        typeof Hands ===
        "undefined" ||
        typeof Camera ===
        "undefined"
    ){

        camStatus.textContent =
            "MEDIAPIPE NÃO CARREGOU. VERIFIQUE A INTERNET.";

        camStatus.className =
            "err";


        return false;

    }


    try{

        handsInstance =
            new Hands({

                locateFile:
                    file =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`

            });


        handsInstance.setOptions({

            maxNumHands:1,

            modelComplexity:0,

            minDetectionConfidence:.6,

            minTrackingConfidence:.5

        });


        handsInstance.onResults(
            onHandResults
        );


        cameraUtilInstance =
            new Camera(
                video,
                {

                    onFrame:
                        async ()=>{
                            try{

                                await handsInstance.send({
                                    image:video
                                });

                            }catch(e){}

                        },

                    width:640,

                    height:480

                }
            );


        await cameraUtilInstance.start();


        camStatus.textContent =
            "VISOR ATIVO // MOSTRE O INDICADOR";


        camStatus.className =
            "ok";


        return true;


    }catch(err){

        console.error(
            err
        );


        camStatus.textContent =
            "FALHA AO INICIAR O RASTREAMENTO.";

        camStatus.className =
            "err";


        return false;

    }

}


/* =========================================================
   BUTTONS
========================================================= */

const btnCamera =
    document.getElementById(
        "btnCamera"
    );


btnCamera.addEventListener(
    "click",
    async ()=>{

        getAudio();


        if(
            audioContext &&
            audioContext.state ===
            "suspended"
        ){

            await audioContext.resume();

        }


        btnCamera.disabled =
            true;


        btnCamera.textContent =
            "CONECTANDO VISOR...";


        const ok =
            await initHandTracking();


        if(ok){

            startScreen.classList.add(
                "hidden"
            );


            startCountdown();

        }else{

            btnCamera.disabled =
                false;


            btnCamera.textContent =
                "⚔ TENTAR NOVAMENTE";

        }

    }
);


const btnRetry =
    document.getElementById(
        "btnRetry"
    );


btnRetry.addEventListener(
    "click",
    ()=>{

        gameOverScreen.classList.add(
            "hidden"
        );


        startCountdown();

    }
);


/* =========================================================
   MOBILE
========================================================= */

document.addEventListener(
    "gesturestart",
    e =>
        e.preventDefault()
);


document.addEventListener(
    "contextmenu",
    e =>
        e.preventDefault()
);


/* =========================================================
   INITIAL UI
========================================================= */

bestInlineVal.textContent =
    bestScore;


updateTimerUI();
