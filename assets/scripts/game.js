const ROWS = 4;
const COLS = 5;
const NUMBERS = [2, 4];

cc.Class({
    extends: cc.Component,

    properties: {
        scoreLabel: cc.Label,
        score: 0,
        blockPrefab: cc.Prefab,
        gap: 20,
        bg: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        this.drawBgBlocks();
        this.init();
    },

    drawBgBlocks() {
        this.blockSize = (cc.winSize.width - this.gap * (COLS + 1)) / COLS;
        let x = this.gap + this.blockSize / 2;
        let y = this.blockSize;
        this.positions = new Array(ROWS).fill([]);
        for (let i = 0; i < ROWS; ++i) {
            for (let j = 0; j < COLS; ++j) {
                let block = cc.instantiate(this.blockPrefab);
                block.width = this.blockSize;
                block.height = this.blockSize;
                this.bg.addChild(block);
                block.setPosition(cc.v2(x, y));
                this.positions[i][j] = cc.v2(x, y);
                x += this.gap + this.blockSize;
                block.getComponent('block').setNumber(0);
            }
            y += this.gap + this.blockSize;
            x = this.gap + this.blockSize / 2;
        }
        console.log(this.positions);
    },

    init() {
        this.updateScore(0);
        if (this.blocks) {
            for (let i = 0; i < ROWS; ++i) {
                for (let j = 0; j < COLS; ++j) {
                    if (this.blocks[i][j] != null) {
                        this.blocks[i][j].destroy();
                    }
                }
            }
        }

        this.data = [];
        this.blocks = [];
        for (let i = 0; i < ROWS; ++i) {
            this.blocks[i] = [];
            this.data[i] = [];
            for (let j = 0; j < COLS; ++j) {
                this.blocks[i][j] = null;
                this.data[i][j] = 0;
            }
        }
        this.addBlock();
        this.addBlock();
        this.addBlock();
    },

    updateScore(number) {
        this.score = number;
        this.scoreLabel.string = '分数：' + number;
    },

    // 找出空闲块，并返回一维数组
    getEmptyLocations() {
        let locations = [];
        for (let i = 0; i < ROWS; ++i) {
            for (let j = 0; j < COLS; ++j) {
                if (this.blocks[i][j] == null) {
                    locations.push(i * ROWS + j);
                }
            }
        }
        return locations;
    },

    addBlock() {
        let locations = this.getEmptyLocations();
        let index = locations[Math.floor(Math.random() * locations.length)];
        let x = Math.floor(index / ROWS);
        let y = Math.floor(index % COLS);
        let position = this.positions[x][y];
        console.log(index);
        console.log(x,y);
        console.log(position);
        let block = cc.instantiate(this.blockPrefab);
        block.width = this.blockSize;
        block.height = this.blockSize;
        this.bg.addChild(block);
        block.setPosition(position);
        block.getComponent('block').setNumber(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
    },
    // update (dt) {},
});
