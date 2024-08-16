import React, { useState, useEffect, useRef} from 'react';

function Slider({ winAm, drawAm, amOfMatches}) {
    const [winPercentApp, setWinPercentApp] = useState(0);
    const [drawPercentApp, setDrawPercentApp] = useState(0);
    const [lossPercentApp, setLossPercentApp] = useState(0);
    const [winDataClass, setWinDataClass] = useState('dontDisp');
    const [drawDataClass, setDrawDataClass] = useState('dontDisp');
    const [lossDataClass, setLossDataClass] = useState('dontDisp');
    const [lossDataWidth, setLossDataWidth] = useState(0)
    const winDataRef = useRef();
    const drawDataRef = useRef();
    const lossDataRef = useRef();
    const winSliderProgress = useRef();
    const drawSliderProgress = useRef();
    const lossSliderProgress = useRef();
    const sliderRef = useRef();
    const lossAm = amOfMatches - winAm - drawAm;

    let winSliderPixelWidth = 0;
    let drawSliderPixelWidth = 0;
    let lossSliderPixelWidth = 0;
    if(sliderRef.current){
        winSliderPixelWidth = (winPercentApp/100) * sliderRef.current.offsetWidth;
        drawSliderPixelWidth = (drawPercentApp/100) * sliderRef.current.offsetWidth;
        lossSliderPixelWidth = (lossPercentApp/100) * sliderRef.current.offsetWidth;
    }
    useEffect(()=>{
        const timeoutId = setTimeout(()=>{
            let winPercent = (winAm/amOfMatches) * 100;
            setWinPercentApp(winPercent);
        }, 10)
        return () => clearTimeout(timeoutId);
    },[])
    useEffect(()=>{
        const timeoutId = setTimeout(()=>{
            let drawPercent = (drawAm/amOfMatches) * 100;
            setDrawPercentApp(drawPercent);
        }, 1010)
        return () => clearTimeout(timeoutId);
    },[])
    useEffect(()=>{
        const timeoutId = setTimeout(()=>{
            let lossPercent = (lossAm/amOfMatches) * 100;
            setLossPercentApp(lossPercent);
        }, 2010)
        return () => clearTimeout(timeoutId);
    },[])
    useEffect(()=>{
        const timeoutId = setTimeout(()=>{
            setLossDataWidth(lossDataRef.current.offsetWidth);
        }, 3010)
        return () => clearTimeout(timeoutId);
    },[])


    useEffect(() => {
        const timeoutId = setTimeout(()=>{
            if (winPercentApp!=0 && winSliderProgress.current && winDataRef.current ) {
                
                const className = winSliderProgress.current.offsetWidth > (winDataRef.current.offsetWidth+5) ? 'left' : 'dontDisp';
                setWinDataClass(className);
            }
        }, 1000)

        return () => clearTimeout(timeoutId);
        
    }, [winPercentApp]);
    useEffect(() => {
        const timeoutId = setTimeout(()=>{
            if (drawPercentApp!=0 && drawSliderProgress.current && drawDataRef.current ) {
                
                const className = drawSliderProgress.current.offsetWidth > (drawDataRef.current.offsetWidth+5) ? 'middle' : 'dontDisp';
                setDrawDataClass(className);
            }
        }, 1000)

        return () => clearTimeout(timeoutId);
        
    }, [drawPercentApp]);
    useEffect(() => {
        const timeoutId = setTimeout(()=>{
            if (lossPercentApp!=0 && lossSliderProgress.current && lossDataRef.current ) {
                
                const className = lossSliderProgress.current.offsetWidth > (lossDataRef.current.offsetWidth+5) ? 'right' : 'dontDisp';
                setLossDataClass(className);
            }
        }, 1000)

        return () => clearTimeout(timeoutId);
        
    }, [lossPercentApp]);
    
    return ( 
        <>
            <div className='slider--sliderContainer' ref={sliderRef}>
                <div className={`slider--perfDataContainer ${winDataClass}`}>
                    <div ref={winDataRef} className="slider--perfData" >{winAm}</div>
                </div>
                <div className={`slider--perfDataContainer ${drawDataClass}`} style={{left:winSliderPixelWidth+"px"}}>
                    <div ref={drawDataRef} className="slider--perfData" >{drawAm}</div>
                </div>
                <div ref={winSliderProgress} className='slider--slider win' style={{width:winSliderPixelWidth+"px"}}></div>
                <div ref={drawSliderProgress} className='slider--slider draw' style={{width:drawSliderPixelWidth+"px"}}></div>
                <div ref={lossSliderProgress} className='slider--slider loss' style={{width:lossSliderPixelWidth+"px"}}></div>
                <div className={`slider--perfDataContainer ${lossDataClass}`} style={{right:(lossDataWidth+10)+"px"}}>
                    <div ref={lossDataRef} className="slider--perfData" >{lossAm}</div>
                </div>
            </div>
        </>
    );
}

export default Slider;