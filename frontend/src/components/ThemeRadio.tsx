import React from 'react';
import Radio from '@mui/material/Radio';
import { useTheme } from '../ThemeContext.tsx';
import type { Theme } from '../ThemeContext.tsx';
import './ThemeRadio.css';

export default function ThemeRadio() {
  const { theme, setTheme } = useTheme();
  const [selectedValue, setSelectedValue] = React.useState(theme as String);


  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
    setTheme(event.target.value as Theme);
  };

  const controlProps = (item: string) => ({
    checked: selectedValue === item,
    onChange: handleChange,
    value: item,
    name: `theme-button-${item}`,
  });

  const buttons = [
    { label: 'grey', checked: '#5c5c5c' },
    { label: 'fall', checked: '#ff8f1f' },
    { label: 'forest', checked: '#3eff28' },
    { label: 'sea', checked: '#3198ff' },
    { label: 'lavender',checked: '#7d2dff' },
    { label: 'bubblegum', checked: '#ce2eff' },
  ]

  return (
    <div
      className="theme-button-row"
    >
        {buttons.map((btn, i) => (
                <Radio disableRipple={true} key={i}
                    {...controlProps(btn.label)}
                    sx={{
                        color: btn.checked,
                        padding: '0px 2px 0px 2px',
                        transition: 'none',
                        transform: 'none',
                        '&.Mui-checked': {
                            color: btn.checked,
                            transition: 'none',
                            transform: 'none',
                        },
                        '& .MuiSvgIcon-root': {
                            transition: 'none',
                        },
                    }}
                />
        ))}
    </div>
  );
}