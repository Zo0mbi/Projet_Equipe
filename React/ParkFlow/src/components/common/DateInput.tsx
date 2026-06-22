import React from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from 'react-datepicker';

// @ts-ignore
import 'react-datepicker/dist/react-datepicker.css';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

const DateInput: React.FC<Props> = ({value, onChange}) => {
  //Version pour web
  if (Platform.OS === 'web') {
    return (
      <DatePicker
        selected={value}
        onChange={(date: Date | null) => {
          if (date) {
            onChange(date);
          }
        }}
        showTimeSelect
        dateFormat="yyyy-MM-dd HH:mm"
      />
    );
  }

  //Version pour mobile/android
  return (
    <DateTimePicker
      value={value}
      mode="datetime"
      display="default"
      onChange={(_event, selectedDate) => {
        if (selectedDate) {
          onChange(selectedDate);
        }
      }}
    />
  );
};

export default DateInput;