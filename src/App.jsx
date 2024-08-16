import fs from 'fs';

import { useState } from 'react'
import RowOfSliders from './RowOfSliders';
import perfData from "../perfData.json"

function App() {
    const [newVersionTag, setNewVersionTag] = useState("");

    let i=-1;
    const slidersElements = perfData.performanceData.map(testData => {
        i++;
        let prevSlider=null;
        if(i!=0){
            prevSlider = {prevWins: perfData.performanceData[i-1].results.wins};
        }
        const {versions, results} = testData;
        const amOfMatches = results.wins + results.draws + results.losses;
        return (
            <RowOfSliders
                amOfMatches={amOfMatches}
                results={results}
                versions={versions}
                prevSlider={prevSlider}
            />
        )
    });

    async function runNewVers(newTag){
        try {
            const response = await fetch('http://localhost:3000/run-exe', {
                method: 'GET',
                headers:{
                    newTag:newTag
                }
            });
            const data = await response.json();
            console.log(`Return value: ${data.exitCode}`);
            
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    };

    function onFormSubmit(e){
        e.preventDefault();
        runNewVers(newVersionTag);
        setNewVersionTag("");
    }
    function onChange(e){
        console.log(e.target.value)
        setNewVersionTag(e.target.value);
    }

    return (
        <>
            <h1 className='heading'>
                Moves Generator Testing
            </h1>
            <div className='sliders'>
                {slidersElements}
            </div>
            <form className='newTestContainer' onSubmit={(e)=>onFormSubmit(e)}>
                <input
                    type="text"
                    placeholder="New Version Tag"
                    onChange={onChange}
                    value={newVersionTag}
                    className='newVersionNameInput'
                />
                <button>
                    Test New Version
                </button>
            </form>
        </>
    )
}

export default App
