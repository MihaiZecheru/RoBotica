import { useEffect, useState } from 'react';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

interface Props {
  options: string[];
  handleChange: (new_value: string) => void;
  _label: string;
  starting_value: string;
  value?: string;
}

const Dropdown = ({ options, handleChange, _label, starting_value, value }: Props) => {
  const [selectedValue, setSelectedValue] = useState(value !== undefined ? value : starting_value);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const _handleChange = (event: any) => {
    const nextValue = event.target.value as string;
    if (value === undefined) {
      setSelectedValue(nextValue);
    }
    handleChange(nextValue);
  };

  return (
    <FormControl sx={{ width: '160px', marginRight: '1rem' }}>
      <InputLabel id={"dropdown-label" + _label}>{_label}</InputLabel>
      <Select
        labelId={"dropdown-label" + _label}
        value={value !== undefined ? value : selectedValue}
        onChange={_handleChange}
        label={_label}
      >
        {
          options.map((option, index) => (
            <MenuItem key={index} value={option}>{option}</MenuItem>
          ))
        }
      </Select>
    </FormControl>
  );
};

export default Dropdown;
