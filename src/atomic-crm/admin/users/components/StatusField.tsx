import { useRecordContext } from 'react-admin';
import { Badge } from '@/components/ui/badge';

interface StatusFieldProps {
  source?: string;
}

export const StatusField = ({ source = 'disabled' }: StatusFieldProps) => {
  const record = useRecordContext();
  if (!record) return null;

  const isDisabled = record[source];

  return (
    <Badge
      variant={isDisabled ? 'secondary' : 'default'}
      className={
        isDisabled
          ? 'bg-muted text-muted-foreground'
          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }
    >
      {isDisabled ? 'Disabled' : 'Active'}
    </Badge>
  );
};

StatusField.defaultProps = {
  label: 'Status',
};
