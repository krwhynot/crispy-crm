-- Add unique constraint to test_user_metadata.user_id
-- This prevents duplicate metadata records for the same user

ALTER TABLE public.test_user_metadata
ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT unique_user_id ON public.test_user_metadata IS
'Ensures each user can only have one metadata record';
