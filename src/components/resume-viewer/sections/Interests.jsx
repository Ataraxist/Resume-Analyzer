import { Sparkles } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import ArrayManager from '../common/ArrayManager';

const Interests = ({ data = [], onChange, editable = false }) => {
  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }
  
  return (
    <SectionWrapper
      icon={Sparkles}
      title="Interests"
    >
      <ArrayManager
        items={data}
        onItemsChange={onChange}
        editable={editable}
        placeholder="Add interest..."
        badgeStyle={true}
      />
    </SectionWrapper>
  );
};

export default Interests;