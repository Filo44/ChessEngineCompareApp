import express from 'express';
import { spawnSync, execFile, exec, execSync, spawn} from 'child_process';
import { performance } from "perf_hooks";
import { join } from 'path';
import perfData from "./perfData.json"  assert { type: "json" }
import versionData from "./versionData.json"  assert { type: "json" }
import equalPos from "./equalPos.json"  assert { type: "json" }
import fs from "fs"
import simpleGit from 'simple-git';
import path from 'path';
import {Chess} from 'chess.js'

const app = express();
const chess = new Chess();
const port = 3000;
const localDir = "C:\\Users\\Filippo\\Downloads\\ChessEngineCompareApp";
const chessEngineRepoURL = "https://github.com/Filo44/ChessEngine";
const initTime = 2000;

let newPerfData = structuredClone(perfData);

// Middleware to handle CORS and preflight requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, newTag'); // Allow your custom header here

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); // Respond OK to preflight
    }

    next();
});

app.post('/start', (req, res) => {
    
});

async function runTest(req){
    console.log(req.body);
    // const versions = req.body.versions;
    const versions = [
        {
            "versionTag": "V2",
            "desc":"A better dummy version :)"
        },{
            "versionTag": "V1",
            "desc":"First version, I did some functions too iteratively and didn't utilize bitboards to their fullest extent."
        }
    ]
    let positions = equalPos.positions;
    console.log("Cloning and building versions")
    for (const version of versions) {
        const cloneToPath = localDir + "\\Versions\\" + version.versionTag;
        if(!folderExists(cloneToPath)){
            await getVersionRepo(version, cloneToPath);
        }
        if(!folderExists(cloneToPath+"\\cpp\\x64")){
            buildExe(cloneToPath + "\\cpp");
        }
    }
    const results = await runThroughPositions(versions, ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"])

    newPerfData.performanceData.push({
        versions:{
            ...versions
        },
        "results":results
    })
    fs.writeFileSync("./perfData.json", JSON.stringify(newPerfData));
}

async function runThroughPositions(versions, positions){
    let tally = {white:0, draw:0, black:0};
    for(let position of positions){
        let port = 8080;
        let color;
        // position = removeMoveCounters(position);
        for(let i=position.length-1; i>-1; i--){
            if(position[i]=="b"){
                color = false
                break;
            }else if(position[i]=="w"){
                color = true;
                break;
            }
        }
        console.log("Starting engine 1 at: " + localDir+"\\Versions\\"+versions[0].versionTag+"\\cpp\\x64\\Release\\Chess 4.exe");
        await startEngine(position, localDir+"\\Versions\\"+versions[0].versionTag+"\\cpp\\x64\\Release\\Chess 4.exe", port, color?1:0);
        console.log("Starting engine 2 at: " + localDir+"\\Versions\\"+versions[1].versionTag+"\\cpp\\x64\\Release\\Chess 4.exe");
        await startEngine(position, localDir+"\\Versions\\"+versions[1].versionTag+"\\cpp\\x64\\Release\\Chess 4.exe", port+1, !color?1:0);
        // console.log("WTF")
        // await sleep(60*60*1000);
        console.log("Fetching http://localhost:8080/GetFirstMove")
        let response = await fetch(
            `http://localhost:8080/GetFirstMove`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify({timeLeft:initTime}) // Send the move data as JSON
                // signal:signal
            }
        )
        let textResponse = await response.text();
        // console.log("Text response: ", textResponse);
        let jsonResponse = JSON.parse(textResponse);
        // console.log("Result from first: ", jsonResponse);
        let initTimeMS = initTime * 1000;
        console.log("Starting recursion");
        console.log("Response.move: ", jsonResponse.move);
        const res = await recursiveCall(jsonResponse.move, 8081, {white:Date.now() + initTimeMS, black:Date.now() + initTimeMS}, !color?"white":"black");
        console.log("Result: ", res);
        tally[res.winner]++;
        stopEngine(8080);
        stopEngine(8081);
    }
    return tally;
}
async function recursiveCall(prevMove, port, cutOffTimes, color){
    let timeLeft = cutOffTimes[color]-Date.now();
    // console.log("cutOffTimes: ", cutOffTimes)
    // console.log("cutOffTimes[color]: ", cutOffTimes[color])
    console.log("Sending: ", JSON.stringify({prevMove: prevMove, timeLeft: timeLeft}));
    let thisFuncStartTime = Date.now();
    let data = await fetch(
        `http://localhost:${port}/MoveResponse`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({prevMove: prevMove, timeLeft: timeLeft}) // Send the move data as JSON
            // signal:signal
        }
    )
    let timeSpent = Date.now() - thisFuncStartTime;

    let textData = await data.text();
    let jsonData = JSON.parse(textData);
    
    console.log("JSON data: ", jsonData);

    let newCutOffTimes = structuredClone(cutOffTimes);
    newCutOffTimes[color]-=timeSpent;
    let invertedColor = color=="white"?"black":"white";;
    if(newCutOffTimes[color]<0){
        return {winner: invertedColor};
    }
    console.log(`Calling: posToFen(${jsonData}, ${invertedColor[0]})`, )
    let fenPos = posToFen(jsonData, invertedColor[0]);
    chess.load(fenPos);
    if(chess.isCheckmate()){
        return {winner: color};
    }
    if(chess.isDraw()){
        return {winner: "draw"};
    }
    return await recursiveCall(jsonData.move, port==8080?8081:8080, newCutOffTimes, invertedColor);

}
function stopEngine(port){
    fetch(
        `http://localhost:${port}/exit`,
        {
            method: 'POST',
        }
    )
}

async function startEngine(fenPos, exePath, port, color){
    console.log(`Starting: ${exePath} ${5} "${fenPos}" ${port} ${color}`);
    console.log("Starting color: ", color)
    const child = spawn(exePath, [5, fenPos, port, color]);
    child.stdout.on('data', (data) => {
        console.log(`stdout (${port}): ${data}`);
    });
    
    child.stderr.on('data', (data) => {
        console.error(`stderr (${port}): ${data}`);
    });
    
    child.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
    });
    await sleep(1000);
    return;
}

async function getVersionRepo(version, cloneToPath){
    const {versionTag, desc} = version;

    await cloneRepo(chessEngineRepoURL, versionData[versionTag], cloneToPath);
}

function buildExe(buildPath){
    // console.log("Executing: ", `cd "${buildPath}"`);
    // execSync(`cd "${buildPath}"`);
    console.log("Executing: ", `nuget restore "Chess 4.sln"`);
    execSync(`C:\\Users\\Filippo\\Downloads\\NuGet\\NuGet.exe restore "Chess 4.sln"`, {cwd:buildPath});
    console.log("Executing: ", `vcpkg integrate project`);
    execSync(`C:\\Users\\Filippo\\vcpkg\\vcpkg\\vcpkg.exe integrate project`, {cwd:buildPath});
    console.log("Executing: ", `msbuild /p:Configuration=Release`);
    execSync(`"D:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\msbuild.exe" /p:Configuration=Release`, {cwd:buildPath});
    return `${buildPath}\\x64\\Release\\Chess 4.exe`
}

async function cloneRepo(repoUrl, commitHash, clonePath) {
    const git = simpleGit();
    console.log('Cloning repository...');
    await git.clone(repoUrl, clonePath);
    console.log('Repository cloned.');

    // Change directory to the cloned repository
    git.cwd(clonePath);
    
    console.log(`Checking out commit ${commitHash}...`);
    await git.checkout(commitHash);
    console.log('Repository ready at specific commit.');
}
function folderExists(dir){
    if (fs.existsSync(dir)) {
        return true;
    } 
    return false;
}
function posToFen(response, singleCharColor){
    console.log("Converting board to fen");
    let board = response.newPos;
    console.log("Board: ", board)
    let fen = ""
    for(let i=0; i<8; i++){
        let currentEmptyStreak = 0;
        for(let j=0; j<8; j++){
            if(board[i][j]!=" "){
                if(currentEmptyStreak!=0){
                    fen += currentEmptyStreak;
                    currentEmptyStreak = 0;
                }
                fen += board[i][j];
            }else{
                currentEmptyStreak++;
            }
        }
        if(currentEmptyStreak!=0){
            fen+=currentEmptyStreak;
        }
        if(i!=7){
            fen += "/";
        }
    }
    fen+=" " + singleCharColor + " "
    if(response.canWhiteCastleKSide){
        fen+="K";
    }
    if(response.canWhiteCastleQSide){
        fen+="Q";
    }
    if(response.canBlackCastleKSide){
        fen+="k";
    }
    if(response.canBlackCastleQSide){
        fen+="q";
    }
    fen+=" -";
    //*En passant is not important because we only use the fen to check if it is checkmate and a possible en passant doesn't change that
    //*TBH neither does castling, I think, but it was too late when I realised :)
    fen+=" 0 1";
    console.log("Result fen: ", fen)
    return fen;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function removeMoveCounters(fen){
    let fenArr = fen.split(''); 
    let spacesRemovedCounter = 0;
    for(let i=fenArr.length-1; i>-1; i--){
        if(spacesRemovedCounter==2){
            fenArr.pop();
            let res = fenArr.join()
            console.log("New fen: ", )
            return res;
        }
        if(fenArr[i]==" "){
            spacesRemovedCounter++;
        }
        fenArr.pop();
    }
}

await runTest("hi");
// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });

