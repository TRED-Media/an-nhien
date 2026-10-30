export const careers = [
 ['photo','📷','Chụp ảnh dạo','Đứng đâu cũng bảo: tự nhiên lên!','#e9b75d','camera'],
 ['driver','🛵','Xe ôm dạo','Thuộc mọi ngõ, trừ ngõ cụt cuộc đời.','#5fa984','helmet'],
 ['boss','💼','Giám đốc họp hoài','Lịch kín mít, ví quên ở nhà.','#435a86','tie'],
 ['collector','📒','Bốc bát họ','Nhớ lịch góp, quên lịch ngủ.','#9873ae','ledger'],
 ['tough','🕶️','Côn đồ hoàn lương','Mặt hơi căng, tâm thích tưới hoa.','#414c60','glasses'],
 ['streamer','🎧','Streamer xóm trọ','Chào cả nhà, mạng lại rớt rồi!','#b47bc2','headset'],
 ['seller','📣','Chiến thần chốt đơn','Một câu cuối thôi… thêm ba tiếng.','#e58176','megaphone'],
 ['office','☕','Dân văn phòng chạy deadline','Excel mở, tâm hồn đi vắng.','#78a9bd','coffee'],
 ['broker','🏠','Cò đất hệ tâm linh','Miếng này view đẹp, nhìn ra bình an.','#b4976a','sign'],
 ['designer','🖌️','Designer sửa lần cuối','Khách nói đơn giản thôi… rồi gửi 36 ý.','#8ca5bd','tablet'],
 ['chef','🍳','Đầu bếp review dạo','Nêm chút muối, kể chuyện hơi mặn.','#eee6d0','chef']
].map(([id,icon,name,description,color,prop])=>({id,icon,name,description,color,prop}));
export const careerFor=id=>careers.find(c=>c.id===id)||careers[0];
export function ranksFor(gender){return gender==='female'?
 [{name:'Sa-di-ni',min:0},{name:'Sư Cô',min:200},{name:'Ni Sư',min:600},{name:'Ni Trưởng (Sư Bà)',min:1500},{name:'Pháp chủ',min:6000}]:
 [{name:'Chú tiểu / Sa-di',min:0},{name:'Đại Đức',min:200},{name:'Thượng Tọa',min:600},{name:'Hòa Thượng',min:1500},{name:'Trưởng lão Hòa Thượng',min:3000},{name:'Pháp chủ',min:6000}];}
export function rankFor(character,merit){if(!character?.awakened)return {name:'Khách hành hương',min:0,index:-1,next:ranksFor(character?.gender)[0]};const ranks=ranksFor(character.gender);let index=0;for(let i=0;i<ranks.length;i++)if(Number(merit)>=ranks[i].min)index=i;return {...ranks[index],index,next:ranks[index+1]||null};}
export function validCharacter(value){return value&&['male','female'].includes(value.gender)&&careers.some(c=>c.id===value.career)?{gender:value.gender,career:value.career,awakened:value.awakened===true}:null;}
