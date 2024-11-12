import { useState } from 'react';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

interface Props {
  options: string[];
  handleChange: (new_value: string) => void;
  _label: string;
  starting_value: string;
}

const Dropdown = ({ options, handleChange, _label, starting_value }: Props) => {
  const [selectedValue, setSelectedValue] = useState(starting_value);

  const _handleChange = (event: any) => {
    const value = event.target.value as string;
    setSelectedValue(value);
    handleChange(value);
  };

  return (
    <FormControl sx={{ width: '160px', marginRight: '1rem' }}>
      <InputLabel id={"dropdown-label" + _label}>{_label}</InputLabel>
      <Select
        labelId={"dropdown-label" + _label}
        value={selectedValue}
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
