const ROWS = 4; // 行数，y的最大值
const COLS = 5; // 列数，x的最大值
const NUMBERS = [2, 4]; // 随机生成的数字
const VEC_LENGTH = 100; // 最小移动长度
const MOVE_DURATIOH = 0.1; // 移动的时长

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
        this.addEventHandler();
    },

    drawBgBlocks() {
        this.blockSize = (cc.winSize.width - this.gap * (COLS + 1)) / COLS;
        let x = this.gap + this.blockSize / 2;
        let y = this.blockSize;
        this.positions = new Array(ROWS);
        for (let i = 0; i < ROWS; ++i) {
            this.positions[i] = [];
            for (let j = 0; j < COLS; ++j) {
                let block = cc.instantiate(this.blockPrefab);
                block.width = this.blockSize;
                block.height = this.blockSize;
                this.bg.addChild(block);
                block.setPosition(cc.v2(x, y));
                this.positions[i].push(cc.v2(x, y));
                x += this.gap + this.blockSize;
                block.getComponent('block').setNumber(0);
            }
            y += this.gap + this.blockSize;
            x = this.gap + this.blockSize / 2;
        }
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
                this.blocks[i].push(null);
                this.data[i].push(0);
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

    // 找出空闲块，并返回块的位置
    getEmptyLocations() {
        let locations = [];
        for (let i = 0; i < ROWS; ++i) {
            for (let j = 0; j < COLS; ++j) {
                if (this.blocks[i][j] == null) {
                    locations.push({ x: i, y: j });
                }
            }
        }
        return locations;
    },

    addBlock() {
        let locations = this.getEmptyLocations();
        if (locations.length == 0) return false;
        let location = locations[Math.floor(Math.random() * locations.length)];
        let x = location.x;
        let y = location.y;
        let position = this.positions[x][y];
        let block = cc.instantiate(this.blockPrefab);
        block.width = this.blockSize;
        block.height = this.blockSize;
        this.bg.addChild(block);
        block.setPosition(position);
        let number = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
        block.getComponent('block').setNumber(number);
        this.blocks[x][y] = block;
        this.data[x][y] = number;
        return true;
    },

    addEventHandler() {
        this.bg.on('touchstart', (event) => {
            this.startPoint = event.getLocation();
        });

        this.bg.on('touchend', (event) => {
            this.touchEnd(event);
        });

        this.bg.on('touchcancel', (event) => {
            this.touchEnd(event);
        });
    },

    touchEnd(event) {
        this.endPoint = event.getLocation();

        let vec = this.endPoint.sub(this.startPoint);
        if (vec.mag() > VEC_LENGTH) {
            if (Math.abs(vec.x) > Math.abs(vec.y)) {
                // 水平方向
                if (vec.x > 0) {
                    this.moveRight();
                } else {
                    this.moveLeft();
                }
            } else {
                // 竖直方向
                if (vec.y > 0) {
                    this.moveUp();
                } else {
                    this.moveDown();
                }
            }
        }
    },

    checkFail() {
        for (let i = 0; i < ROWS; ++i) {
            for (let j = 0; j < COLS; ++j) {
                let n = this.data[i][j];
                if (n == 0) return false;
                if (j > 0 && this.data[i][j - 1] == n) return false;
                if (j < COLS && this.data[i][j + 1] == n) return false;
                if (i > 0 && this.data[i - 1][j] == n) return false;
                if (i < ROWS && this.data[i + 1][j] == n) return false;
            }
        }
        return true;
    },

    gameOver() {

    },

    afterMove(hasMoved) {
        if (hasMoved) {
            this.updateScore(this.score + 1);
            this.addBlock();
        }
        if (this.checkFail()) {
            this.gameOver();
        }
    },

    //移动格子
    doMove(block, position, callback) {
        let action = cc.moveTo(MOVE_DURATIOH, position);
        let finish = cc.callFunc(() => {
            callback && callback();
        });
        block.runAction(cc.sequence(action, finish));
    },

    /*迭代算法
    移到顶：结束迭代
    当前数字为空：结束迭代
    相邻数字为空：移动
    与相邻数字相同：合并，结束迭代
    与相邻数字不相同：结束迭代
    */
    moveLeft() {
        let hasMoved = false;
        let move = (x, y, callback) => {
            if (y == 0 || this.data[x][y] == 0) {
                callback && callback();
                return;
            } else if (this.data[x][y - 1] == 0) {
                // 移动
                let block = this.blocks[x][y];
                let position = this.positions[x][y - 1];
                this.blocks[x][y - 1] = block;
                this.data[x][y - 1] = this.data[x][y];
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.doMove(block, position, () => {
                    move(x, y - 1, callback);
                });
                hasMoved = true;
            } else if (this.data[x][y - 1] == this.data[x][y]) {
                // 合并
                let block = this.blocks[x][y];
                let position = this.positions[x][y - 1];
                this.data[x][y - 1] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x][y - 1].getComponent('block').setNumber(this.data[x][y - 1]);
                this.doMove(block, position, () => {
                    block.destroy();
                    callback && callback();
                });
                hasMoved = true;
            } else {
                callback && callback();
                return;
            }
        };

        let toMove = [];
        for (let i = 0; i < ROWS; ++i) {
            for (let j = 0; j < COLS; ++j) {
                if (this.data[i][j] != 0) {
                    toMove.push({ x: i, y: j });
                }
            }
        }

        let counter = 0;
        for (let i = 0; i < toMove.length; ++i) {
            move(toMove[i].x, toMove[i].y, () => {
                counter++;
                if (counter == toMove.length) {
                    this.afterMove(hasMoved);
                }
            });
        }
    },

    moveRight() {
        let hasMoved = false;
        let move = (x, y, callback) => {
            if (y == COLS - 1 || this.data[x][y] == 0) {
                callback && callback();
                return;
            } else if (this.data[x][y + 1] == 0) {
                // 移动
                let block = this.blocks[x][y];
                let position = this.positions[x][y + 1];
                this.blocks[x][y + 1] = block;
                this.data[x][y + 1] = this.data[x][y];
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.doMove(block, position, () => {
                    move(x, y + 1, callback);
                });
                hasMoved = true;
            } else if (this.data[x][y + 1] == this.data[x][y]) {
                // 合并
                let block = this.blocks[x][y];
                let position = this.positions[x][y + 1];
                this.data[x][y + 1] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x][y + 1].getComponent('block').setNumber(this.data[x][y + 1]);
                this.doMove(block, position, () => {
                    block.destroy();
                    callback && callback();
                });
                hasMoved = true;
            } else {
                callback && callback();
                return;
            }
        };

        let toMove = [];
        for (let i = 0; i < ROWS; ++i) {
            for (let j = COLS - 1; j >= 0; --j) {
                if (this.data[i][j] != 0) {
                    toMove.push({ x: i, y: j });
                }
            }
        }

        let counter = 0;
        for (let i = 0; i < toMove.length; ++i) {
            move(toMove[i].x, toMove[i].y, () => {
                counter++;
                if (counter == toMove.length) {
                    this.afterMove(hasMoved);
                }
            });
        }
    },

    moveUp() {
        let hasMoved = false;
        let move = (x, y, callback) => {
            if (x == ROWS - 1 || this.data[x][y] == 0) {
                callback && callback();
                return;
            } else if (this.data[x + 1][y] == 0) {
                // 移动
                let block = this.blocks[x][y];
                let position = this.positions[x + 1][y];
                this.blocks[x + 1][y] = block;
                this.data[x + 1][y] = this.data[x][y];
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.doMove(block, position, () => {
                    move(x + 1, y, callback);
                });
                hasMoved = true;
            } else if (this.data[x + 1][y] == this.data[x][y]) {
                // 合并
                let block = this.blocks[x][y];
                let position = this.positions[x + 1][y];
                this.data[x + 1][y] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x + 1][y].getComponent('block').setNumber(this.data[x + 1][y]);
                this.doMove(block, position, () => {
                    block.destroy();
                    callback && callback();
                });
                hasMoved = true;
            } else {
                callback && callback();
                return;
            }
        };

        let toMove = [];
        for (let i = ROWS - 1; i >= 0; --i) {
            for (let j = 0; j < COLS; ++j) {
                if (this.data[i][j] != 0) {
                    toMove.push({ x: i, y: j });
                }
            }
        }

        let counter = 0;
        for (let i = 0; i < toMove.length; ++i) {
            move(toMove[i].x, toMove[i].y, () => {
                counter++;
                if (counter == toMove.length) {
                    this.afterMove(hasMoved);
                }
            });
        }
    },

    moveDown() {
        let hasMoved = false;
        let move = (x, y, callback) => {
            if (x == 0 || this.data[x][y] == 0) {
                callback && callback();
                return;
            } else if (this.data[x - 1][y] == 0) {
                // 移动
                let block = this.blocks[x][y];
                let position = this.positions[x - 1][y];
                this.blocks[x - 1][y] = block;
                this.data[x - 1][y] = this.data[x][y];
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.doMove(block, position, () => {
                    move(x - 1, y, callback);
                });
                hasMoved = true;
            } else if (this.data[x - 1][y] == this.data[x][y]) {
                // 合并
                let block = this.blocks[x][y];
                let position = this.positions[x - 1][y];
                this.data[x - 1][y] *= 2;
                this.data[x][y] = 0;
                this.blocks[x][y] = null;
                this.blocks[x - 1][y].getComponent('block').setNumber(this.data[x - 1][y]);
                this.doMove(block, position, () => {
                    block.destroy();
                    callback && callback();
                });
                hasMoved = true;
            } else {
                callback && callback();
                return;
            }
        };

        let toMove = [];
        for (let i = 0; i < ROWS; ++i) {
            for (let j = 0; j < COLS; ++j) {
                if (this.data[i][j] != 0) {
                    toMove.push({ x: i, y: j });
                }
            }
        }

        let counter = 0;
        for (let i = 0; i < toMove.length; ++i) {
            move(toMove[i].x, toMove[i].y, () => {
                counter++;
                if (counter == toMove.length) {
                    this.afterMove(hasMoved);
                }
            });
        }
    },
    // update (dt) {},
});
