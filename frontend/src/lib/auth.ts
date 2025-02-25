import { supabase } from "./supabase";

export default async function signInWithGoogle () {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/auth/callback`
        }
    });
    
    if (error) {
        console.log(`Error while sigin via google provider ${error}`);
    }

    return data;
}