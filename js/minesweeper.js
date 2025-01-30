'use strict'

var gBoard
var gLevel = {
    size: null,
    mines: null
}

var gGame = {
    isOn: false,
    coveredCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gMinesClicked = 0
var gFirstClick = true

var gLives = 3

var gTimerInterval;
var gStartTime;

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

function onInit() {
    console.log('Game started')
    gBoard = buildBoard(gLevel.size)
    renderBoard(gBoard)
    gFirstClick = true
    document.querySelector('.difficulty-header').style.display = 'none'
    document.querySelector('.gameover-modal').style.display = 'none'
    document.querySelector('.gameover-modal h4').innerText = ''
    gLives = 3
    gMinesClicked = 0
    document.querySelector('.lives span').innerText = gLives
    document.querySelector('.smile-button').innerText = '🙂'
    startTimer()

}

function displayLives() {
    document.querySelector('.lives span').innerText = gLives
}

function setDifficulty(cells, mines) {
    gLevel.size = cells
    gLevel.mines = mines
    onInit()
}

function buildBoard(cellAmt) {
    const board = []
    for (var i = 0; i < cellAmt; i++) {
        board.push([])
        for (var j = 0; j < cellAmt; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isCovered: true,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board
}

function renderBoard(board) {
    var strHTML = '<table><tbody>'
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j]
            var className = cell.isCovered ? 'covered' : 'uncovered'
            var cellContent = cell.isMarked ? '🏴‍☠️' : (cell.isCovered ? '🟥' : (cell.isMine ? '💣' : cell.minesAroundCount))
            strHTML += `<td class="${className}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this, ${i}, ${j}); return false;">${cellContent}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'
    var elBoard = document.querySelector('.board-container')
    elBoard.innerHTML = strHTML
}

function onCellClicked(elCell, i, j) {
    if (gFirstClick) {
        //place mines on first click
        setMines(gBoard, { i, j })
        //false means the next clicks will not render more mines
        gFirstClick = false
    }

    // Uncover the cell and update the board
    gBoard[i][j].isCovered = false

    //check if clicked cell is mine
    if (gBoard[i][j].isMine) {
        elCell.innerHTML = '💣'
        console.log('life lost')
        gLives--
        gMinesClicked++
        document.querySelector('.lives span').innerText = gLives

        //let's player know he stepped on a mine by changing smile button for a second
        var smileButton = document.querySelector('.smile-button')
        smileButton.innerText = '🤫 Cover that up!'
        setTimeout(() => {
            smileButton.innerText = '🙂'
        }, 500)

        //marked means the cell has been uncovered
        if (gBoard[i][j].isMarked) {
            gBoard[i][j].isCovered = false
        }

    } else {
        //uncover empty neighboring cells
        if (gBoard[i][j].minesAroundCount === 0)
            expandUncover(gBoard, elCell, i, j)
    }
    renderBoard(gBoard)
    checkGameOver()
}

function onCellMarked(elCell, i, j) {
    gBoard[i][j].isMarked = !gBoard[i][j].isMarked

    renderBoard(gBoard)
    checkGameOver()
}

function setMines(board, firstClickIdx) {
    var numOfMines = 0
    while (numOfMines < gLevel.mines) {
        var i = getRandomInt(0, gLevel.size - 1)
        var j = getRandomInt(0, gLevel.size - 1)
        if (!board[i][j].isMine && (i !== firstClickIdx.i || j !== firstClickIdx.j)) {
            board[i][j].isMine = true
            numOfMines++
        }
    }
    setMinesNegsCount(board)
}

function setMinesNegsCount(board) {
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

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            if (!board[i][j].isMine) {
                var minesCount = 0
                for (var k = 0; k < directions.length; k++) {
                    var x = i + directions[k].x
                    var y = j + directions[k].y
                    if (x >= 0 && x < board.length && y >= 0 && y < board[i].length) {
                        if (board[x][y].isMine) minesCount++
                    }
                }
                board[i][j].minesAroundCount = minesCount
            }
        }
    }
}

function expandUncover(board, elCell, i, j) {
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

    for (var k = 0; k < directions.length; k++) {
        var x = i + directions[k].x
        var y = j + directions[k].y
        if (x >= 0 && x < board.length && y >= 0 && y < board[i].length) {
            var cell = board[x][y]
            if (!cell.isMine && cell.isCovered) {
                cell.isCovered = false
                if (cell.minesAroundCount === 0) {
                    expandUncover(board, elCell, x, y)
                }
            }
        }
    }
}


function checkGameOver() {
    var allMinesMarked = true
    var allCellsUncovered = true
    var gameoverDisplay = document.querySelector('.gameover-modal')
    var gameoverText = document.querySelector('.gameover-modal h4')
    var smileButton = document.querySelector('.smile-button')

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var cell = gBoard[i][j]
            if (cell.isMine && !cell.isMarked) {
                allMinesMarked = false
            }
            if (!cell.isMine && cell.isCovered) {
                allCellsUncovered = false
            }
        }
    }

    // If the player has lost all lives or all mines have been clicked
    if (gLives === 0 || gMinesClicked === gLevel.mines) {
        console.log('You lost')
        gameoverText.innerText = 'You lost'
        gameoverDisplay.style.display = 'flex'
        smileButton.innerText = '🤯'
        gGame.isOn = false
        stopTimer()
    }
    else {
        // If all mines are marked and all other cells are uncovered, the player wins
        if (allMinesMarked && allCellsUncovered) {
            console.log('You Won!')
            gameoverText.innerText = 'You Won!'
            gameoverDisplay.style.display = 'flex'
            smileButton.innerText = '😎'
            gGame.isOn = false
            stopTimer()
            // Save the time to localStorage
            var elapsedTime = Math.floor((Date.now() - gStartTime) / 1000);
            saveAndShowBestTime(elapsedTime);
        }
    }
}

function saveAndShowBestTime(time) {
    var bestTimeOnDifficulty = 'bestTime-' + gLevel.size
    var bestTime = localStorage.getItem(bestTimeOnDifficulty)
    if (!bestTime || time < bestTime) {
        localStorage.setItem(bestTimeOnDifficulty, time)
        bestTime = time
    }

    //show the saved score on the game page
    var begScoreStr = document.querySelector('.best-score-beginner')
    var medScoreStr = document.querySelector('.best-score-medium')
    var expScoreStr = document.querySelector('.best-score-expert')
    if (gLevel.size === 4) {
        begScoreStr.innerText = `Best Beginner Time: ${bestTime} seconds`
    } else if (gLevel.size === 8) {
        medScoreStr.innerText = `Best Medium Time: ${bestTime} seconds`
    } else if (gLevel.size === 12) {
        expScoreStr.innerText = `Best Expert Time: ${bestTime} seconds`
    }
}

function toggleBackground() {
    var bodycolor = document.body
    var button = document.querySelector('.background-button')
    bodycolor.classList.toggle('dark-mode')
    if (body.classList.contains('dark-mode')) {
        button.innerText = 'Light Mode'
    } else {
        button.innerText = 'Dark Mode'
    }
}

function mineExterminator() {
    if (gLevel.mines === 0) {
        alert("You must play one move to render the mines")
        return

    } else if (gLevel.mines <= 3) {
        alert("There are not enough mines on this difficulty")
        return

    } else if (gLevel.mines > 3)
        var minesRemoved = 0
    while (minesRemoved < 3) {
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[i].length; j++)
                if (gBoard[i][j].isMine) {
                    gBoard[i][j].isMine = false
                    minesRemoved++
                    if (minesRemoved >= 3) break
                }
        }
        if (minesRemoved >= 3) break
    }
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}