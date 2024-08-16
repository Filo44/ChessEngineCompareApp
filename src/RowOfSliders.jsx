import React, { useState, useEffect } from 'react';
import Slider from './Slider';

function RowOfSliders({versions, results, prevSlider, amOfMatches}) {
    const [showPrevSliders, setShowPrevSliders] = useState(false);
    const {wins, draws, losses} = results;
    useEffect(()=>{
        const timeoutId = setTimeout(()=>{
            setShowPrevSliders(true);
        }, 1000)
        return () => clearTimeout(timeoutId);
    },[prevSlider])

    let changeEls = [];
    if(prevSlider!=null){
        changeEls = [<div></div>];
        let {prevWins} = prevSlider;

        let percent = ((wins/prevWins)*100);

        let percentChange = percent-100;
        let rounded = Math.floor(percentChange*100)/100;
        let dispValue = percentChange < 0 ? rounded+"%" : "+"+rounded+"%";
        changeEls.push(
            <div className={`slider--change ${percentChange < 0 ? "red" : "green"} ${showPrevSliders? "" : "dontDisp"}`}>
                {dispValue}
            </div>
        )
        changeEls.push(<div></div>)
    }

    return ( 
        <>  
            {changeEls}
            <div className='slider--tag'>{versions[0].versionTag}</div>
            <Slider
                amOfMatches={amOfMatches}
                winAm={wins}
                drawAm={draws}
            />
            <div className='slider--tag'>{versions[1].versionTag}</div>
        </> 
    );
}

export default RowOfSliders;