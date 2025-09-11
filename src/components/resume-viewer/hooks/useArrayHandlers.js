export const useArrayHandlers = (data, onChange) => {
  const handleRemove = (index) => {
    const newData = [...data];
    newData.splice(index, 1);
    onChange(newData);
  };

  const handleUpdate = (index, field, value) => {
    const newData = [...data];
    if (field.includes('.')) {
      // Handle nested fields like 'dates.start'
      const fields = field.split('.');
      let current = newData[index];
      for (let i = 0; i < fields.length - 1; i++) {
        if (!current[fields[i]]) current[fields[i]] = {};
        current = current[fields[i]];
      }
      current[fields[fields.length - 1]] = value;
    } else {
      newData[index][field] = value;
    }
    onChange(newData);
  };

  return { handleRemove, handleUpdate };
};