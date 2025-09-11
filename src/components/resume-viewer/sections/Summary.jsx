import { FileText } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import { ParagraphSkeleton } from '../common/SkeletonComponents';

function Summary({ data = '', onChange, editable = true, isLoading = false }) {
  const showSkeleton = isLoading && (data === undefined || data === null);
  
  // Hide empty section in view mode
  if (!editable && !isLoading && !data) {
    return null;
  }
  
  return (
    <SectionWrapper icon={FileText} title="Professional Summary">
      {showSkeleton ? (
        <ParagraphSkeleton lines={4} />
      ) : (
      <div className="animate-fade-in">
      <FieldEditor
        value={data}
        onChange={onChange}
        placeholder="Write a brief professional summary..."
        type="multiline"
        editable={editable}
        className="text-gray-700 dark:text-gray-300"
      />
      </div>
      )}
    </SectionWrapper>
  );
}

export default Summary;