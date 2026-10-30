export async function registerAndSignIn(client,{email,password,displayName}){
 const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:displayName}}});
 if(error)throw error;
 if(data.session)return data.session;
 // Also handles projects that create the account without returning a session.
 const login=await client.auth.signInWithPassword({email,password});
 if(login.error){if(/email not confirmed/i.test(login.error.message))throw Error('Supabase vẫn đang yêu cầu xác nhận email. Chủ chùa cần tắt Confirm email để đăng ký là vào chơi ngay.');throw login.error;}
 if(!login.data.session)throw Error('Chưa tạo được phiên đăng nhập. Hãy thử lại.');
 return login.data.session;
}
