// Fictional training environment. Never opens network connections.
export const DEPARTMENTS=[['bio','Биохимия','#3de0ed'],['hema','Гематология','#f77fb8'],['elisa','ИФА','#bb9eff'],['clia','ИХЛ','#ffd36f'],['coag','Коагулология','#7befaf']];
import profiles from './instrument-profiles.json' with {type:'json'};
export const DEVICES=profiles.map((d,i)=>({...d,color:DEPARTMENTS[Math.floor(i/2)][2],x:100+Math.floor(i/2)*190,y:i%2?415:180,seconds:8+i%3*2}));
export const FAULTS=[
 {id:'link',title:'Нет Ethernet Link',log:'LINK DOWN. Кабельный тракт не отвечает.',diagnosis:'Проверить физический канал',steps:['Восстановить учебный кабель','Проверить Link и обмен'],hint:'Начните с физического соединения. Перезапуск приложения не восстановит разрыв кабеля.'},
 {id:'listener',title:'Сервис LIS недоступен',log:'TCP connection refused. Адрес доступен, слушатель остановлен.',diagnosis:'Проверить порт LIS',steps:['Запустить учебный слушатель LIS','Проверить ответ ACK'],hint:'Узел доступен, но соединение отвергается на уровне порта.'},
 {id:'serial',title:'Ошибка кадра RS-232',log:'FRAMING ERROR. Параметры последовательного канала изменились.',diagnosis:'Сравнить параметры MOXA',steps:['Восстановить профиль MOXA из паспорта','Проверить тестовый кадр'],hint:'Скорость, биты данных, чётность и стоп-биты должны совпадать на обоих концах.'},
 {id:'ack',title:'Результат ждёт подтверждения',log:'ACK TIMEOUT. Учебный результат остаётся в буфере.',diagnosis:'Проверить журнал протокола',steps:['Восстановить обработчик подтверждений','Повторить отправку с тем же ID'],hint:'Повторная отправка сохраняет идентификатор: результат не должен задвоиться.'},
 {id:'reagent',title:'Реагент исчерпан',log:'REAGENT EMPTY. Измерения приостановлены.',diagnosis:'Проверить расходные материалы',steps:['Заменить учебный реагент','Выполнить успешный контроль'],hint:'Возврат в работу в этом сценарии требует замены реагента и успешного контроля.'},
 {id:'jam',title:'Затор загрузчика',log:'RACK BLOCKED. Пробирка сохранена в очереди прибора.',diagnosis:'Осмотреть загрузчик',steps:['Остановить узел и устранить учебный затор','Выполнить тест загрузчика'],hint:'Сначала безопасная остановка учебного узла, затем устранение затора и тест.'}
];
export const REPAIR_HELP={
 link:{action:'Подключить кабель и проверить связь',explain:'Учебный кабель отошёл. Подключим его и проверим обмен с LIS.',joke:'Кабель решил поработать удалённо. Вернём в офис.'},
 listener:{action:'Запустить сервис LIS',explain:'Сервис приёма остановлен. Запустим его и отправим проверочный пакет.',joke:'Сервис ушёл за кофе и забыл предупредить.'},
 serial:{action:'Вернуть настройки MOXA',explain:'Восстановим скорость и формат передачи из паспорта, затем проверим тестовый кадр.',joke:'Прибор и MOXA заговорили на разных диалектах. Нужен переводчик.'},
 ack:{action:'Повторить отправку и получить ответ',explain:'Восстановим подтверждения и отправим тот же результат повторно, без дубликатов.',joke:'LIS прочитала сообщение, но не ответила. Знакомая история.'},
 reagent:{action:'Заменить реагент и пройти контроль',explain:'Учебная замена реагента и проверка контроля выполнятся автоматически.',joke:'Анализатор проголодался. Меню сегодня — реагент.'},
 jam:{action:'Освободить загрузчик и проверить ход',explain:'Остановим учебный узел, освободим загрузчик и проверим его. Пробирка останется в работе.',joke:'Пробирки устроили совещание в загрузчике. Пора расходиться.'}
};
export const FAULT_INTERVAL=150;
export const QUEUE_CAPACITY=120;
export const MILESTONES=[{id:'first-ten',target:10,bonus:100,title:'Первые 10 результатов'},{id:'fifty',target:50,bonus:250,title:'50 результатов за смену'}];
export const DIAGNOSES=FAULTS.map(f=>f.diagnosis);
export const FIXES=FAULTS.flatMap(f=>f.steps);
export const emptyConfig=()=>({});
export function validateConfig(device,c){return Object.keys(device.passport).filter(k=>{const value=String(c[k]??'').trim();if(device.name==='ACL TOP'&&['instrumentId','hostId'].includes(k))return !value;if(device.name==='ABX Pentra 400'&&k==='transmission')return !['Order','Test'].includes(value);if(device.name==='Access 2'&&k==='baud')return !['2400','9600'].includes(value);return value!==device.passport[k];});}
export function initialState(mode='shift'){return{version:2,nextFaultAt:FAULT_INTERVAL,connectedOnce:[],bonuses:[],intakeHeld:false,mode,time:0,running:false,finished:false,nextId:1,received:0,released:0,lost:0,errors:0,repairs:0,processed:0,score:0,rng:7419,queue:[],tubes:[],results:[],devices:DEVICES.map(d=>({id:d.id,connected:false,config:emptyConfig(),fault:null,diagnosed:false,step:0,job:null,remaining:0,done:0})),log:[{time:0,text:'Смена подготовлена. Откройте ICM и инструкции, настройте приборы и запустите поток.'}]};}
function note(s,text){s.log=[{time:s.time,text},...s.log].slice(0,18);}
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
export function reduceLab(state,action){const s=structuredClone(state);const d=s.devices.find(x=>x.id===action.id);const model=DEVICES.find(x=>x.id===action.id);
 if(action.type==='pause'){s.running=false;return s;}
 if(action.type==='toggle'){if(!s.finished)s.running=!s.running;return s;}
 if(action.type==='connect'&&d){if(d.fault){note(s,'Сначала завершите диагностику и ремонт '+model.name);return s;}const errors=validateConfig(model,action.config);d.config={...action.config};d.connected=!errors.length;if(errors.length){s.errors++;note(s,model.name+': обмен не установлен. Сверьте конфигурацию со статьёй прибора и назначением порта в ICM.');}else{if(!s.connectedOnce.includes(d.id)){if(!s.connectedOnce.length)s.nextFaultAt=s.time+FAULT_INTERVAL;s.connectedOnce.push(d.id);s.score+=25;note(s,model.name+': Подключен! +25 за первое подключение. Ещё один прибор в команде.');}else note(s,model.name+': Подключен. Настройки проверены.');} return s;}
 if(action.type==='repair-choice'&&d?.fault){if(action.choice!==d.fault){s.errors++;note(s,'Это действие не устраняет причину: '+FAULTS.find(f=>f.id===d.fault).hint);return s;}action={...action,type:'repair'};}
 if(action.type==='repair'&&d?.fault){const training=d.trainingFault;d.fault=null;d.connected=true;d.diagnosed=false;d.step=0;d.trainingFault=false;s.repairs++;s.nextFaultAt=s.time+FAULT_INTERVAL;if(!training)s.score+=50;note(s,model.name+': снова Подключен. Очередь сохранена. '+(training?'Учебный ремонт пройден.':'Бонус +50. Инженер победил, пробирки аплодируют.'));return s;}
 if(action.type==='release'){if(!s.results.length)return s;const n=s.results.length;s.released+=n;s.score+=n*15;s.results=[];note(s,'Выдано '+n+' результатов: +'+(n*15)+' очков. Пробирки довольны, принтер пока не в курсе.');for(const m of MILESTONES)if(s.released>=m.target&&!s.bonuses.includes(m.id)){s.bonuses.push(m.id);s.score+=m.bonus;note(s,m.title+': бонус +'+m.bonus+'! Отличная работа.');}return s;}
 if(action.type==='incident'&&d?.connected&&!s.devices.some(x=>x.fault)&&FAULTS.some(f=>f.id===(action.fault||'link'))){d.trainingFault=true;d.fault=action.fault||'link';d.connected=false;d.diagnosed=false;d.step=0;note(s,model.name+': '+FAULTS.find(f=>f.id===d.fault).title);return s;}
 if(action.type!=='tick'||!s.running||s.finished)return state;
 s.time++;
 // A five-minute shift has a draining phase: no new samples, all in-flight work is retained.
 const accepting=s.mode==='endless'||s.time<=300;
 if(accepting&&s.time%3===0){if(s.queue.length>=QUEUE_CAPACITY){if(!s.intakeHeld)note(s,'Приём временно на паузе: очередь заполнена. Никого не теряем — сортер бережёт пробирки.');s.intakeHeld=true;}else{if(s.intakeHeld)note(s,'В очереди появилось место. Приём возобновлён!');s.intakeHeld=false;const dept=DEPARTMENTS[(s.nextId-1)%DEPARTMENTS.length][0];s.queue.push({id:s.nextId++,department:dept,created:s.time});s.received++;}}
 if(accepting&&s.time>=s.nextFaultAt&&!s.devices.some(x=>x.fault)){const available=s.devices.filter(x=>x.connected);if(available.length){const broken=available[Math.floor(random(s)*available.length)],m=DEVICES.find(x=>x.id===broken.id);const pool=FAULTS.filter(f=>f.id!=='serial'||m.passport.transport==='RS-232');const f=pool[Math.floor(random(s)*pool.length)];broken.fault=f.id;broken.connected=false;broken.diagnosed=false;broken.step=0;broken.trainingFault=false;s.nextFaultAt=s.time+FAULT_INTERVAL;note(s,m.name+': '+f.title+'. '+REPAIR_HELP[f.id].joke);}}
 for(const machine of s.devices){const m=DEVICES.find(x=>x.id===machine.id);if(!machine.connected||machine.fault)continue;
  if(machine.job){machine.remaining--;if(machine.remaining<=0){s.results.push({...machine.job,device:m.name});machine.done++;s.processed++;machine.job=null;}}
  if(!machine.job&&!s.tubes.some(t=>t.device===m.id)){const idx=s.queue.findIndex(t=>t.department===m.department);if(idx>=0){const [tube]=s.queue.splice(idx,1);s.tubes.push({...tube,device:m.id,travel:0});}}
 }
 for(const tube of s.tubes)tube.travel=Math.min(5,tube.travel+1);
 s.tubes=s.tubes.filter(t=>{const machine=s.devices.find(d=>d.id===t.device);if(t.travel>=5&&machine.connected&&!machine.fault&&!machine.job){machine.job={id:t.id,department:t.department,created:t.created};machine.remaining=DEVICES.find(d=>d.id===t.device).seconds;return false;}return true;});
 if(!accepting&&!s.queue.length&&!s.tubes.length&&!s.devices.some(d=>d.job)){s.running=false;s.finished=true;note(s,'Поток завершён. Выдайте оставшиеся результаты и подведите итог смены.');}
 return s;
}
export function restoreState(raw){try{const s=JSON.parse(raw);if(![1,2].includes(s.version)||!['shift','endless'].includes(s.mode)||!Array.isArray(s.devices)||s.devices.length!==DEVICES.length||s.devices.some((d,i)=>d.id!==DEVICES[i].id||d.fault&&!FAULTS.some(f=>f.id===d.fault))||!['queue','tubes','results','log'].every(k=>Array.isArray(s[k]))||s.queue.length>QUEUE_CAPACITY||s.tubes.length>10||s.results.length>10000||!['time','received','released','lost','errors','repairs','score','nextId','processed','rng'].every(k=>Number.isFinite(s[k])&&s[k]>=0))return initialState();return{...s,version:2,running:false,nextFaultAt:s.version===2&&Number.isFinite(s.nextFaultAt)?s.nextFaultAt:s.time+FAULT_INTERVAL,connectedOnce:Array.isArray(s.connectedOnce)?[...new Set(s.connectedOnce.filter(id=>DEVICES.some(d=>d.id===id)))]:s.devices.filter(d=>d.connected||d.fault||d.done).map(d=>d.id),bonuses:Array.isArray(s.bonuses)?s.bonuses.filter(id=>MILESTONES.some(m=>m.id===id)):MILESTONES.filter(m=>s.released>=m.target).map(m=>m.id),intakeHeld:Boolean(s.intakeHeld)};}catch{return initialState();}}
export function tubePosition(t){const m=DEVICES.find(d=>d.id===t.device),p=t.travel/5;if(p<.7)return{x:45+(m.x-45)*p/.7,y:300};return{x:m.x,y:300+(m.y-300)*(p-.7)/.3};}
