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



function onInit() {
    console.log('Game started')
    gGame.isOn = false
    gGame.coveredCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0
    gBoard = buildBoard(gLevel.size)
    renderBoard(gBoard)
    gFirstClick = true
    gManuallyCreate = false
    gExterminator = true
    document.querySelector('.difficulty-header').style.display = 'none'
    document.querySelector('.gameover-modal').style.display = 'none'
    document.querySelector('.gameover-modal h4').innerText = ''
    gLives = 3
    gMinesClicked = 0
    document.querySelector('.lives span').innerText = gLives
    document.querySelector('.smile-button').innerText = '🙂'
    gSafeClicks = 3
    document.querySelector('.safeclick-button').innerText = 'Safe Click (3 Clicks Left)'
    gHints = 3
    document.querySelector('.hint-button').innerText = '3 Hints Left'
    document.querySelector('.lightbulbs').innerText = '💡💡💡'
    gPreviousMoves = null
    gMegaHint = false
    gfirstCell = null
    gSecondCell = null

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
                isMarked: false,
                isHighlighted: false,
                isHinted: false
            }
        }
    }
    gGame.isOn = true
    gGame.coveredCount = cellAmt * cellAmt
    return board
}

function renderBoard(board) {
    var strHTML = '<table><tbody>'
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j]
            var className = `cell-${i}-${j}`
            if (cell.isCovered) {
                className += '-covered'
            } else if (!cell.isCovered) {
                className += '-uncovered'
            } else if (cell.isMine) {
                className += '-mine'
            } else if (cell.isMarked) {
                className += '-marked'
            }

            var cellContent = cell.isMarked ? '🏴‍☠️' : (cell.isCovered ? '🪨' : (cell.isMine ? '💣' : cell.minesAroundCount))
            var cellStyle = ''
            
            if (cell.isCovered)
                cellStyle = 'background-color: #8B4513;'
            if (cell.isHighlighted)
                cellStyle = 'background-color: #4CAF50;'
            if (cell.isMarked)
                cellStyle = 'background-color: #FFD700;'
            if (cell.isMine && !cell.isCovered)
                cellStyle = 'background-color: #FF0000;'

            strHTML += `<td class="${className}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this, ${i}, ${j}); return false;" style="${cellStyle}">${cellContent}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'
    var elBoard = document.querySelector('.board-container')
    elBoard.innerHTML = strHTML
}

function onCellClicked(elCell, i, j) {

    if (gManuallyCreate) {
        gBoard[i][j].isMine = !gBoard[i][j].isMine
        gBoard[i][j].isCovered = false
        renderBoard(gBoard)

        setTimeout(() => {
            gBoard[i][j].isCovered = true
            renderBoard(gBoard)
        }, 1250)

        return
    }

    // gBoard[safeCell.i][safeCell.j].isHighlighted = true
    // renderBoard(gBoard)

    // gSafeClicks--

    // setTimeout(() => {
    //   gBoard[safeCell.i][safeCell.j].isHighlighted = false
    // renderBoard(gBoard)
    // }, 1500)

    if (!gGame.isOn) return // game is off so do nothing

    if (gFirstClick) {
        //place mines on first click
        setMines(gBoard, { i, j })
        //false means the next clicks will not render more mines
        gFirstClick = false
    }

    if (gMegaHint) {
        if (!gfirstCell) {
            gfirstCell = { i, j }
            document.querySelector('.mega-hint').innerText = 'Select Second Cell'
        } else if (!gSecondCell) {
           gSecondCell = { i, j }
            megaHintMode(gfirstCell, gSecondCell)
            gfirstCell = null
            gSecondCell = null
            gMegaHint = false // Exit Mega Hint mode after selecting the second cell
            document.querySelector('.mega-hint').innerText = 'Mega Hint';
        }
        return

    }

    savecurrentGame() // save  the current board arrangement for the undo button

        // Uncover the cell and update the board
        if (gBoard[i][j].isCovered) {
            gBoard[i][j].isCovered = false
            gGame.coveredCount--
        }

        //check if clicked cell is mine
        if (gBoard[i][j].isMine) {
            elCell.innerHTML = '💣'
            var bombSound = document.querySelector('#mine')
            bombSound.play()
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

            //marked means the cell has been uncovered and added to the marked counter
            if (gBoard[i][j].isMarked) {
                gGame.markedCount++
                gBoard[i][j].isCovered = false
            }

        } else {
            //uncover empty neighboring cells
            if (gBoard[i][j].minesAroundCount === 0)
                expandUncover(gBoard, elCell, i, j)
            var uncoverSound = document.querySelector('#uncover')
            uncoverSound.play()
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
        var loseSound = document.querySelector('#lose')
        loseSound.play()
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
            var winSound = document.querySelector('#win')
            winSound.play()
            gameoverText.innerText = 'You Won!'
            gameoverDisplay.style.display = 'flex'
            smileButton.innerText = '😎'
            gGame.isOn = false
            stopTimer()
            // Save the time to localStorage
            var elapsedTime = Math.floor((Date.now() - gStartTime) / 1000);
            console.log('Elapsed Time:', elapsedTime)
            gGame.secsPassed = elapsedTime
            saveAndShowBestTime();
        }
    }
}




function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min

}