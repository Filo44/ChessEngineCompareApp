import fs from "fs"
import pgnParser from '@mliebelt/pgn-parser';
import { spawn } from 'child_process';
import { Chess } from 'chess.js'
const path = 'C:\\Users\\Filippo\\Downloads\\stockfish\\stockfish.exe';

const evalTime = 1000;
let currentEval;
let evalIsMate = false; 
let finished = true;

const stockfish = spawn(path);
console.log("Loaded stockfish")


stockfish.stdout.on('data', (data) => parseOutputs(data));

stockfish.stderr.on('data', (data) => {
  console.error(`stderr: ${data.toString()}`);
});

stockfish.on('error', (err) => {
  console.error(`Failed to start Stockfish: ${err.message}`);
});

stockfish.on('close', (code) => {
  console.log(`Stockfish process exited with code ${code}`);
});

stockfish.stdin.write('uci\n');
await sleep(1000);

let chess = new Chess();

const pgn = fs.readFileSync('./lichessPos.pgn', 'utf-8');
console.log("Read the PGNs")

const games = pgnParser.parse(pgn);
console.log("Parsed the PGNs")
const equalEvalPos = [];
for(let i=0; equalEvalPos.length<400 && i<games.length; i++){
    chess = new Chess();
    console.log("-----------------")
    stockfish.stdin.write("ucinewgame\n")
    await sleep(250);
    const game = games[i];
    // console.log("game: ", game);

    let pgnMoves = game.moves.map(move=>{
        return move.notation.notation;
    })
    console.log(pgnMoves)
    //Ignores the first 10%, and the last 5%
    const randomMove = (((Math.random()*85)+10)/100) * pgnMoves.length;
    
    // Convert moves to UCI format for Stockfish
    let uciMoves = [];
    for(let j=0; j<randomMove; j++){
        let pgnMove = pgnMoves[j];
        const move = chess.move(pgnMove);
        uciMoves.push(move.lan);
    }
    console.log(uciMoves)
    // // Prepare the UCI command for Stockfish
    const uciCommand = `position startpos moves ${uciMoves.join(' ')}\n`;
    console.log("Writing: ", uciCommand);
    stockfish.stdin.write(uciCommand);
    await sleep(250);
    console.log("Starting: ", `go movetime ${evalTime}\n`)
    
    stockfish.stdin.write(`go movetime ${evalTime}\n`);

    currentEval = null;
    evalIsMate = false;
    finished = false;
    await new Promise((resolve) => {
        const thisInterval = setInterval(()=>{
            if(finished){
                resolve();
                console.log("Resolving")
                clearInterval(thisInterval);
            }
        },100)
    });
    console.log("Finished search")
    if(currentEval>-0.2 && currentEval<0.2 && !evalIsMate){
        console.log("Equal pos")
        equalEvalPos.push(chess.fen());
    }
    chess.clear();
    // console.log("------------------------------")
}
console.log(equalEvalPos)
equalEvalPos.forEach(pos=>{
    console.log(pos+",")
})
fs.writeFileSync("./equalPos.json", JSON.stringify({positions:equalEvalPos}))

function parseOutputs(data){
    const output = data.toString();

    // Print Stockfish output for debugging
    // console.log(`Stockfish output: ${output}`);
    
    // Check for evaluation info
    const evalMatch = output.match(/info .*\bscore (cp|mate) (-?\d+)/);
    if (evalMatch) {
    const evalType = evalMatch[1];
    const evalValue = parseInt(evalMatch[2], 10);

    if (evalType === 'cp') {
        currentEval = evalValue/100;
        console.log(`Evaluation (centipawns): ${evalValue / 100}`);
    } else if (evalType === 'mate') {
        evalIsMate = true;
        console.log(`Mate in ${Math.abs(evalValue)}`);
    }
    }
    // Check if finished
    if (output.includes('bestmove')) {
        let lines = output.split('\n');
        lines.forEach(line=>{
            if(line.includes('bestmove')){
                const bestMove = line.split(' ')[1];
                console.log(`Best move: ${bestMove}`);
                console.log(`Actual eval: ${currentEval}`)
                finished = true;
            }
        })
        
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
