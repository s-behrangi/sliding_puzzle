import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

interface SizeSliderProps {
    n: number,
    setN: (n: number) => void,
}

const SizeSlider: React.FC<SizeSliderProps> = ({
    n,
    setN,
}) => {
    const [val, setVal] = useState(n);

    const handleChange = (_e: Event, value: number) => {
        setVal(Number(value));
        setN(Number(value));
    }

    useEffect(() => {
        setVal(n);
    }, [n])

    return (
        <Box sx={{ alignSelf: 'center', width: '80%' }}>
        <Slider
            aria-label="size"
            value={val}
            defaultValue={3}
            getAriaValueText={() => `{val}`}
            shiftStep={30}
            step={1}
            marks
            min={2}
            max={12}
            onChange={handleChange}
            valueLabelDisplay="off"
            sx={{
                '& .MuiSlider-root': {
                    position: 'center',
                },
                '& .MuiSlider-thumb': {
                width: '20px',
                height: '30px',
                background: 'var(--button-bg)',
                borderRadius: '0px', /* Forces rectangular shape */
                borderTopWidth: '2px',
                borderBottomWidth: '2px',
                borderLeftWidth: '5px',
                borderRightWidth: '5px',
                borderStyle: 'outset',
                borderColor: 'var(--button-border)',
                boxShadow: 'none',
                outline: 'none',
                '&:hover, &:active, &:focus, &:focus-visible': {
                    boxShadow: 'none',
                    outline: 'none',
                },
                '&:dragging': {
                    boxShadow: 'none',
                    outline: 'none',
                },
                '&.Mui-active, &.Mui-focusVisible': {
                    boxShadow: 'none',
                    outline: 'none',
                },
                },
                '& .MuiSlider-track': {
                    display: 'none',
                },
                '& .MuiSlider-rail': {
                    background: 'var(--slider-rail)',
                    height: '2px',
                },
                '& .MuiSlider-mark': {
                    height: '5px',
                    width: '3px',
                    background: 'var(--slider-marks)',
                },

            }}
        />
        </Box>
    );
};

export default React.memo(SizeSlider);
