'use strict'

var gTimerInterval
var gStartTime

var gSafeClicks = 3

var gHints = 3

var gManuallyCreate = false

var gExterminator = true

var gPreviousMoves = null

var gMegaHint = false
var gfirstCell = null
var gSecondCell = null

function savecurrentGame() {
    gPreviousMoves = {
        board: copyBoard(gBoard),
        game: {
            isOn: gGame.isOn,
            coveredCount: gGame.coveredCount,
            markedCount: gGame.markedCount,
            secsPassed: gGame.secsPassed
        },
        minesClicked: gMinesClicked,
        firstClick: gFirstClick,
        lives: gLives,
        safeClicks: gSafeClicks,
        hints: gHints,
        exterminator: gExterminator
    }
}

function copyBoard(board) {
    const newBoard = []
    for (var i = 0; i < board.length; i++) {
        newBoard.push([])
        for (var j = 0; j < board[i].length; j++) {
            newBoard[i].push({ ...board[i][j] })
        }
    }
    return newBoard
}

function undoClick() {
    if (!gPreviousMoves) {
        alert("No moves to undo")
        return;
    }

    gBoard = copyBoard(gPreviousMoves.board)
    gGame = {
        isOn: gPreviousMoves.game.isOn,
        coveredCount: gPreviousMoves.game.coveredCount,
        markedCount: gPreviousMoves.game.markedCount,
        secsPassed: gPreviousMoves.game.secsPassed
    };
    gMinesClicked = gPreviousMoves.minesClicked
    gFirstClick = gPreviousMoves.firstClick
    gLives = gPreviousMoves.lives
    gSafeClicks = gPreviousMoves.safeClicks
    gHints = gPreviousMoves.hints
    gExterminator = gPreviousMoves.exterminator

    renderBoard(gBoard)
}


function startTimer() {
    gStartTime = Date.now()
    gTimerInterval = setInterval(updateTimer, 1000)
}

function updateTimer() {
    var gameTime = Math.floor((Date.now() - gStartTime) / 1000)
    document.querySelector('.score span').innerText = gameTime
}

function stopTimer() {
    clearInterval(gTimerInterval)
}

function toggleManuallyCreateMode() {
    if (!gLevel.size || !gLevel.mines) {
        alert('Please select difficulty')
        return
    }

    gManuallyCreate = !gManuallyCreate
    var buttonText = document.querySelector('.place-bombs-button')

    buttonText.innerText = gManuallyCreate ? 'Play Mode' : 'Manually Create Mode'

    if (gManuallyCreate) {
        gGame.isOn = false
    } else {
        gGame.isOn = true
        setMinesNegsCount(gBoard)
        startTimer()
    }
    renderBoard(gBoard)
}

function saveAndShowBestTime() {
    var time = gGame.secsPassed
    var bestBegTime = localStorage.getItem('bestTime-4')
    var bestMedTime = localStorage.getItem('bestTime-8')
    var bestExpTime = localStorage.getItem('bestTime-12')

    bestBegTime = bestBegTime ? parseInt(bestBegTime, 10) : null
    bestMedTime = bestMedTime ? parseInt(bestMedTime, 10) : null
    bestExpTime = bestExpTime ? parseInt(bestExpTime, 10) : null

    if (gLevel.size === 4) {
        if (!bestBegTime || time < bestBegTime) {
            localStorage.setItem('bestTime-4', time)
            bestBegTime = time
        }
    } else if (gLevel.size === 8) {
        if (!bestMedTime || time < bestMedTime) {
            localStorage.setItem('bestTime-8', time)
            bestMedTime = time
        }
    } else if (gLevel.size === 12) {
        if (!bestExpTime || time < bestExpTime) {
            localStorage.setItem('bestTime-12', time)
            bestExpTime = time
        }
    }

    //show the saved score on the game page
    var begScoreStr = document.querySelector('.best-score-beginner')
    var medScoreStr = document.querySelector('.best-score-medium')
    var expScoreStr = document.querySelector('.best-score-expert')
    if (gLevel.size === 4) {
        begScoreStr.innerText = `Best Beginner Time: ${bestBegTime} seconds`
    } else if (gLevel.size === 8) {
        medScoreStr.innerText = `Best Medium Time: ${bestMedTime} seconds`
    } else if (gLevel.size === 12) {
        expScoreStr.innerText = `Best Expert Time: ${bestExpTime} seconds`
    }
    console.log('Best time being displayed:', bestBegTime, bestMedTime, bestExpTime)
}

function toggleBackground() {
    var bodycolor = document.body
    var button = document.querySelector('.background-button')
    bodycolor.classList.toggle('dark-mode')
    if (bodycolor.classList.contains('dark-mode')) {
        button.innerText = 'Light Mode'
    } else {
        button.innerText = 'Dark Mode'
    }
}

function mineExterminator() {

    if (gExterminator === false) {
        console.log('Already clicked')
        alert('You may only click once per game')
    }
    if (gLevel.mines === 0) {
        alert("You must play one move to render the mines")
        return

    } else if (gLevel.mines <= 3) {
        alert("There are not enough mines on this difficulty")
        return
    }

    var minesRemoved = 0
    const mineArray = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++)
            if (gBoard[i][j].isMine) {
                mineArray.push({ i, j })

            }
    }

    while (minesRemoved < 3) {
        var ranIdx = getRandomInt(0, mineArray.length - 1)
        var ranMine = mineArray.splice(ranIdx, 1)[0]
        gBoard[ranMine.i][ranMine.j].isMine = false
        console.log(ranMine.i, ranMine, j)
        minesRemoved++
    }
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
    gExterminator = false
}



function safeClickButton() {

    if (gSafeClicks <= 0) {
        alert("No Safe Clicks")
        return
    }

    if (gFirstClick) {
        alert("Play First Move")
        return
    }
    const safeCellsArray = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (!gBoard[i][j].isMine && gBoard[i][j].isCovered) {
                safeCellsArray.push({ i, j })
            }
        }
    }

    if (safeCellsArray.length === 0) {
        alert("No Safe Cells Remaining")
        return
    }


    var ranIdx = getRandomInt(0, safeCellsArray.length - 1)
    var safeCell = safeCellsArray[ranIdx]

    gBoard[safeCell.i][safeCell.j].isHighlighted = true
    renderBoard(gBoard)

    gSafeClicks--

    setTimeout(() => {
        gBoard[safeCell.i][safeCell.j].isHighlighted = false
        renderBoard(gBoard)
    }, 1500)

    var safeClickText = document.querySelector('.safeclick-button')
    safeClickText.innerText = `Safe Click (${gSafeClicks} Clicks Left)`
}

function getHint() {
    if (gHints <= 0) {
        alert("No Safe Clicks")
        return
    }

    if (gFirstClick) {
        alert("Play First Move")
        return
    }

    const randomArray = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j].isCovered && areAllNeighborsCovered(gBoard, i, j)) {

                randomArray.push({ i, j })
            }
        }
    }
    if (randomArray.length === 0) {
        alert("Not enough cells")
        return
    }
    var ranIdx = getRandomInt(0, randomArray.length - 1)
    var hintCell = randomArray[ranIdx]

    uncoverCellAndNeighbors(hintCell.i, hintCell.j)
    gHints--

    var hintButton = document.querySelector('.hint-button')
    var lightBulbs = document.querySelector('.lightbulbs')

    hintButton.innerText = `${gHints} Hints Left`

    if (gHints === 2) {
        lightBulbs.innerText = '💡💡'
    }
    if (gHints === 1) {
        lightBulbs.innerText = '💡'
    }
    if (gHints <= 0) {
        lightBulbs.innerText = '🌚'
    }
}

function areAllNeighborsCovered(board, i, j) {
    const directions = [
        { x: -1, y: 0 }, // left of cell
        { x: 1, y: 0 }, // right 
        { x: 0, y: -1 }, // up 
        { x: 0, y: 1 }, // down 
        { x: -1, y: -1 }, // top-left 
        { x: 1, y: -1 }, // top-right 
        { x: -1, y: 1 }, // bottom-left 
        { x: 1, y: 1 } // bottom-right
    ];

    for (var k = 0; k < directions.length; k++) {
        var x = i + directions[k].x
        var y = j + directions[k].y
        if (x >= 0 && x < board.length && y >= 0 && y < board[i].length) {
            if (!board[x][y].isCovered) {
                return false
            }
        }
    }
    return true
}

function uncoverCellAndNeighbors(i, j) {
    const directions = [
        { x: -1, y: 0 }, // left of cell
        { x: 1, y: 0 }, // right 
        { x: 0, y: -1 }, // up 
        { x: 0, y: 1 }, // down 
        { x: -1, y: -1 }, // top-left 
        { x: 1, y: -1 }, // top-right 
        { x: -1, y: 1 }, // bottom-left 
        { x: 1, y: 1 } // bottom-right
    ]

    gBoard[i][j].isCovered = false
    gBoard[i][j].isHinted = true

    for (var k = 0; k < directions.length; k++) {
        var x = i + directions[k].x
        var y = j + directions[k].y
        if (x >= 0 && x < gBoard.length && y >= 0 && y < gBoard[i].length) {
            gBoard[x][y].isCovered = false
            gBoard[x][y].isHinted = true
        }
    }
    renderBoard(gBoard)

    setTimeout(() => {
        gBoard[i][j].isCovered = true
        gBoard[i][j].isHinted = false
        for (var k = 0; k < directions.length; k++) {
            var x = i + directions[k].x;
            var y = j + directions[k].y;
            if (x >= 0 && x < gBoard.length && y >= 0 && y < gBoard[i].length) {
                gBoard[x][y].isCovered = true
                gBoard[x][y].isHinted = false
            }
        }
        renderBoard(gBoard)
    }, 1500)
}

function megaHintMode(firstCell, secondCell) {

    var firstRow = Math.min(firstCell.i, secondCell.i)
    var lastRow = Math.max(firstCell.i, secondCell.i)
    var firstCol = Math.min(firstCell.j, secondCell.j)
    var lastCol = Math.max(firstCell.j, secondCell.j)

    for (var i = firstRow; i <= lastRow; i++) {
        for (var j = firstCol; j <= lastCol; j++) {
            gBoard[i][j].isCovered = false
        }
    }
    renderBoard(gBoard)

    setTimeout(() => {
        for (var i = firstRow; i <= lastRow; i++) {
            for (var j = firstCol; j <= lastCol; j++) {
                gBoard[i][j].isCovered = true
            }
        }
        renderBoard(gBoard)
    }, 2000)
}

function toggleMegaHint() {

    if (!gLevel.size || !gLevel.mines) {
        alert('Please select difficulty')
        return
    }

    if (gFirstClick) {
        alert('Mines must be placed on the board')
        return
    }

    gMegaHint = !gMegaHint
    var button = document.querySelector('.mega-hint')
    button.innerText = gMegaHint ? 'Select Cells or Click to Return' : 'Mega Hint'
}