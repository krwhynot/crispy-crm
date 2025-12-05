import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  useNotify,
  useRedirect,
  useDataProvider,
} from 'react-admin';
import { useMutation } from '@tanstack/react-query';
import { ROLE_CHOICES } from './schemas';
import type { CrmDataProvider } from '../../providers/types';

export const UserSlideOver = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const dataProvider = useDataProvider<CrmDataProvider>();

  const { mutate: updateUser } = useMutation({
    mutationFn: async (data: any) => {
      return dataProvider.updateUser({
        sales_id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        disabled: data.disabled,
      });
    },
    onSuccess: () => {
      notify('User updated successfully');
      redirect('/admin/users');
    },
    onError: (error: Error) => {
      notify(error.message || 'Failed to update user', { type: 'error' });
    },
  });

  const handleSubmit = (data: any) => {
    updateUser(data);
  };

  return (
    <Edit
      title="Edit Team Member"
      resource="sales"
      redirect="/admin/users"
      mutationMode="pessimistic"
    >
      <SimpleForm onSubmit={handleSubmit}>
        <TextInput
          source="first_name"
          label="First Name"
          fullWidth
          required
        />
        <TextInput
          source="last_name"
          label="Last Name"
          fullWidth
          required
        />
        <TextInput
          source="email"
          label="Email"
          fullWidth
          disabled
          helperText="Email cannot be changed"
        />
        <SelectInput
          source="role"
          label="Role"
          choices={ROLE_CHOICES}
          fullWidth
          required
        />
        <BooleanInput
          source="disabled"
          label="Account Disabled"
          helperText="Disabled accounts cannot log in"
        />
      </SimpleForm>
    </Edit>
  );
};
