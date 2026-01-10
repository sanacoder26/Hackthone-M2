
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.28.0';

const supabaseUrl = 'https://yuzxkvytvrddnmjmgruy.supabase.co'
const supabaseKey = 'sb_publishable_JBsEL2knsHDwhNyYct_osA_WnrTSDrK'


const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
