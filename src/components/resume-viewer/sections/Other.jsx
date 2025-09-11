import { MoreHorizontal } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';

const Other = ({ data = '', onChange, editable = false }) => {
  // Hide empty section in view mode
  if (!editable && !data) {
    return null;
  }
  
  return (
    <SectionWrapper
      icon={MoreHorizontal}
      title="Additional Information"
    >
      <FieldEditor
        value={data}
        onChange={onChange}
        editable={editable}
        placeholder="Any additional information you'd like to include..."
        type="multiline"
      />
    </SectionWrapper>
  );
};

export default Other;