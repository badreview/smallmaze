let c = document.getElementById("canvas");
let ctx = c.getContext("2d");
let c2 = document.getElementById("canvas2");
let ctx2 = c2.getContext("2d");

let problem =  {
    driver: {
        x: 250,
        y: 250
    },
    sinks: [
        {
            x: 134,
            y: 77
        },
        {
            x: 410,
            y: 320
        }
    ],
    edges: [
        [250, 250, 281, 250],
        [281, 250, 281, 129],
        [250, 250, 331, 250],
        [331, 250, 331, 221]
    ]
}

problem.sinks = []
for (let i = 0; i < 5; i++) {
    let x = Math.floor(Math.random() * 440)
    let y = Math.floor(Math.random() * 440)
    problem.sinks.push({x: x, y:y})

}

function draw(prob, cx) {
    drawEdge(prob['edges'], cx);
    cx.fillStyle = 'red';
    drawDriver(prob.driver, cx);
    //ctx.fillStyle = 'green';
    drawSinks(prob.sinks, cx);
}

function drawEdge(edges, cx) {
    let wl = 0
    edges.forEach(element => {
        cx.beginPath();
        cx.moveTo(element[0], element[1]);
        cx.lineTo(element[2], element[3]);
        cx.closePath();
        cx.stroke();        
        wl += Math.abs(element[0] - element[2])
        wl += Math.abs(element[1] - element[3])        
    });
    cx.font = '24px serif';
    cx.fillText(wl.toString(), 250, 250);    
}

function drawDriver(pt, cx) {
    cx.moveTo(pt.x, pt.y);
    cx.arc(pt.x, pt.y, 5, 0, Math.PI * 2, true);
    cx.fill()
}

function drawSinks(sinks, cx) {
    sinks.forEach(pt => {
        console.log(pt)
        cx.moveTo(pt.x, pt.y);
        cx.arc(pt.x, pt.y, 5, 0, Math.PI * 2, true);
        cx.fill()
    })
}

function buildGrid(problem) {
    let xs = new Set()
    let ys = new Set()
    xs.add(problem.driver.x)
    ys.add(problem.driver.y)
    problem.sinks.forEach(pt => {
        xs.add(pt.x)
        ys.add(pt.y)

    })
    let id2xy = [[], []]
    let xy2id = [new Map(), new Map()]
    xs.forEach(p => {
        id2xy[0].push(p)
    })
    ys.forEach(p => {
        id2xy[1].push(p)
    })
    id2xy.forEach(arr => {
        arr.sort(function(a, b){return a-b});
    })
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < id2xy[i].length; j++) {
            xy2id[i].set(id2xy[i][j], j);
        }
    }
    let gridData = {
        size : [xs.size, ys.size],
        id2xy : id2xy,
        xy2id : xy2id,
        addWave : function(wave, grid) {
            grid[xy2id[0].get(wave.xy[0])][xy2id[1].get(wave.xy[1])].wave = wave;
        },
        getWave : function(wave, grid) {
            return grid[xy2id[0].get(wave.xy[0])][xy2id[1].get(wave.xy[1])].wave;
        },
        getExp : function(wave, gridArr, xoff, yoff, useF) {
            let idx0 = xy2id[0].get(wave.xy[0]);
            let idy0 = xy2id[1].get(wave.xy[1]);
            let idx = idx0 + xoff;
            let idy = idy0 + yoff;           
            if (idx < 0 || idx >= this.size[0] || idy < 0 || idy >= this.size[1]) {
                return null
            }
            let costOff = 0
            let nx = id2xy[0][idx]
            let ny = id2xy[1][idy]
            if (xoff != 0) {
                costOff = Math.abs(nx - wave.xy[0])
            } else {
                costOff = Math.abs(ny - wave.xy[1])
            }
            let force = gridArr[idx][idy].force
            let newWave = {
                xy: [nx, ny],
                cost: wave.cost + costOff,
                parent: [idx0, idy0],
                tag: wave.tag
            }
            if (useF === 1) {
                newWave.cost += force
            }
            return newWave
        }


    }
    return gridData;

}

function w2s(wave) {
    return "[(" + wave.xy[0].toString() +", "+ wave.xy[1].toString() + "), c: " + wave.cost.toString() + "] "
}

function addForce(gridData, gridArr, sinks) {
    //gridData.maxForce = 0;
    for (let i = 0; i < gridArr.length; i++) {
        for (let j = 0; j < gridArr[i].length; j++) {
            sinks.forEach(pt => {
                let gx = gridData.id2xy[0][i]
                let gy = gridData.id2xy[1][j]
                let f = Math.abs(pt.x - gx) + Math.abs(pt.y - gy)
                f = f * 0.1
                gridArr[i][j].force = Math.floor(f)
                //gridData.maxForce = Math.max(gridData.maxForce, Math.floor(f))
            })
        }
    }
}
function routing(problem, useF) {
    let gridData = buildGrid(problem)
    let gridArr = []
    for (let i = 0; i < gridData.size[0]; i++) {
        let arr = []
        for (let j = 0; j < gridData.size[1]; j++) {
            arr.push({ wave: null, force: 0})
        }
        gridArr.push(arr);
    }
    addForce(gridData, gridArr, problem.sinks)
    console.log(gridData)
    console.log(gridArr)
    let queue = {
        arr : [],
        head : 0,
        tail : -1,
        enque : function(wave) {
            let cost = wave.cost
            if (cost >= this.arr.length) {
                console.log("ERROR: BIG COST!")
                return
            }
            this.arr[cost].push(wave);
            if (cost > this.tail) {
                this.tail = cost
            }
        },
        deque : function() {
            if (this.head > this.tail) return null
            while(this.arr[this.head].length === 0 && this.head <= this.tail) {
                this.head++;
            }
            if (this.head > this.tail) return null
            let ret = this.arr[this.head].pop()
            return ret
        },
        reset: function() {
            this.arr = []
            for (let i = 0; i < 20000; i++) {
                this.arr.push([])
            }
            this.head = 0
            this.tail = -1
        }
    }

    let rootWave = {
        xy: [problem.driver.x, problem.driver.y],
        cost: 0,
        parent: [-1, -1]
    }
    
    let solNodes = [rootWave]
    let solEdges = []
    problem.sinks.forEach(pt => {
        let sinkWave = {
            xy: [pt.x, pt.y],
            cost: -1,
            parent: [-1, -1],
            tag: -1
        }
        gridData.addWave(sinkWave, gridArr);
    }) 
    for (let i = 0; i < problem.sinks.length; i++) {
        queue.reset()
        solNodes.forEach(w => {
            w.tag = i
            w.cost = 0
            w.parent = [-1, -1]
            queue.enque(w);
            gridData.addWave(w, gridArr)
        })
       
        let currW = null
        while(currW = queue.deque()) {
            console.log("DQ:" + w2s(currW))
            //console.log(currW)
            let gridW = gridData.getWave(currW, gridArr);
            //console.log(gridW)
            if (gridW != null && gridW.cost === -1) {
                //hit target, backtrace
                console.log("HIT!")
                console.log(currW)
                gridW.cost = 0
                gridW.parent = [-1, -1]
                solNodes.push(gridW);
                let px = currW.parent[0]
                let py = currW.parent[1]
                while (px >= 0 ) {
                    let p1 = currW.xy
                    currW = gridArr[px][py].wave
                    solNodes.push(currW)
                    solEdges.push([currW.xy[0], currW.xy[1], p1[0], p1[1]])
                    px = currW.parent[0]
                    py = currW.parent[1]
                    currW.parent = [-1, -1]
                }
                break;
            }
            //check existing wave
            if (gridW === null || gridW.tag != i || gridW.cost >= currW.cost) {
                //expand
                gridData.addWave(currW, gridArr);
                let expandDir = [[1, 0], [-1, 0], [0, 1], [0, -1]]
                expandDir.forEach(data => {
                    let nWave = gridData.getExp(currW, gridArr, data[0], data[1], useF);
                    if (nWave !== null) {
                        console.log("Enque: " + w2s(nWave))
                        //console.log(nWave)
                        queue.enque(nWave)
                    }                
                })
            }
        }
    }
    problem.edges = solEdges;
}

routing(problem, 1)
draw(problem, ctx)
routing(problem, 0)
draw(problem, ctx2)
console.log(problem.sinks)
console.log(problem.edges)

