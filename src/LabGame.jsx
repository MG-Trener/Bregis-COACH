import React,{useEffect,useReducer,useState}from'react';
import{DEVICES,DEPARTMENTS,FAULTS,REPAIR_HELP,MILESTONES,emptyConfig,initialState,reduceLab,restoreState,tubePosition}from'./lab-engine.mjs';
const FIELD_LABELS={
  "host": "Адрес сервера LIS",
  "port": "Назначенный порт ICM",
  "transport": "Интерфейс",
  "protocol": "Протокол обмена",
  "moxa": "Адрес MOXA",
  "channel": "Канал MOXA",
  "mode": "Сетевая роль / MOXA",
  "baud": "Скорость, бод",
  "bits": "Биты данных",
  "parity": "Чётность",
  "stop": "Стоп-биты",
  "flow": "Контроль потока",
  "profile": "Profile",
  "transmission": "Automatic transmission",
  "loading": "Analyser Loading Mode",
  "query": "Режим запроса",
  "hostOn": "HOST COMMUNICATION",
  "barcode": "Идентификатор Barcode Setting",
  "newMode": "NewMode",
  "autoRerun": "Auto Rerun TS",
  "autoSend": "Автоматическая передача",
  "ack": "Подтверждение связи",
  "inputMode": "Способ ввода номера",
  "bidirectional": "Двунаправленная связь",
  "barcodeRead": "Чтение ID пробирки",
  "autoOrder": "Заказ анализов с пробоподатчика",
  "active": "Обмен с хостом активен",
  "autoWL": "Автоматический приём WL",
  "instrumentId": "Instrument / Analys. ID",
  "hostId": "Host ID",
  "osMatch": "COM-порт в программе и ОС совпадает",
  "lisInterface": "LIS Interface",
  "globalLIS": "Global LIS Interface",
  "hostQuery": "Host Query",
  "internalId": "Use internal instrument sample ID",
  "autoDownload": "Automatic downloading",
  "online": "On-Line Transmission"
};
const FIELD_OPTIONS={
  "transport": [
    "TCP",
    "RS-232"
  ],
  "protocol": [
    "ASTM",
    "ASTM E1394",
    "Full ASTM-1394",
    "Futura",
    "HL7"
  ],
  "mode": [
    "TCP Client",
    "TCP Server",
    "Real COM"
  ],
  "baud": [
    "1200",
    "2400",
    "4800",
    "9600",
    "19200",
    "38400",
    "115200"
  ],
  "bits": [
    "7",
    "8"
  ],
  "parity": [
    "None",
    "Even",
    "Odd"
  ],
  "stop": [
    "1",
    "2"
  ],
  "flow": [
    "None",
    "RTS/CTS",
    "XON/XOFF"
  ],
  "profile": [
    "None",
    "Default"
  ],
  "transmission": [
    "Order",
    "Test",
    "Off"
  ],
  "loading": [
    "Identification",
    "Position"
  ],
  "query": [
    "Query Mode",
    "Batch Mode"
  ],
  "barcode": [
    "Sample ID",
    "Rack ID"
  ],
  "inputMode": [
    "Вручную",
    "Автоматически"
  ],
  "newMode": [
    "On",
    "Off"
  ],
  "autoRerun": [
    "On",
    "Off"
  ],
  "autoSend": [
    "On",
    "Off"
  ],
  "ack": [
    "On",
    "Off"
  ],
  "bidirectional": [
    "On",
    "Off"
  ],
  "barcodeRead": [
    "On",
    "Off"
  ],
  "autoOrder": [
    "On",
    "Off"
  ],
  "active": [
    "On",
    "Off"
  ],
  "autoWL": [
    "On",
    "Off"
  ],
  "osMatch": [
    "On",
    "Off"
  ],
  "lisInterface": [
    "On",
    "Off"
  ],
  "globalLIS": [
    "On",
    "Off"
  ],
  "hostQuery": [
    "On",
    "Off"
  ],
  "internalId": [
    "On",
    "Off"
  ],
  "autoDownload": [
    "On",
    "Off"
  ],
  "hostOn": [
    "Yes",
    "No"
  ],
  "online": [
    "Yes",
    "No"
  ]
};
const KEY='bregis-lab-icm-v3';
const time=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`;
function load(){try{return restoreState(localStorage.getItem(KEY));}catch{return initialState();}}
export default function LabGame(){const[state,dispatch]=useReducer((s,a)=>a.type==='reset'?initialState(a.mode):reduceLab(s,a),null,load),[selected,setSelected]=useState('an0'),[config,setConfig]=useState(emptyConfig()),[reset,setReset]=useState(false),[saveError,setSaveError]=useState(false),[help,setHelp]=useState(false),[icm,setIcm]=useState(false);const model=DEVICES.find(d=>d.id===selected),device=state.devices.find(d=>d.id===selected),fault=FAULTS.find(f=>f.id===device.fault),connected=state.devices.filter(d=>d.connected).length;
useEffect(()=>{setConfig({...device.config});},[selected]);
useEffect(()=>{const timer=setInterval(()=>dispatch({type:'tick'}),1000);const hide=()=>{if(document.hidden)dispatch({type:'pause'});};document.addEventListener('visibilitychange',hide);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',hide);};},[]);
useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(state));setSaveError(false);}catch{setSaveError(true);}},[state]);
const field=(name,label,options)=><label key={name}>{label}{options?<select value={config[name]??''} onChange={e=>setConfig({...config,[name]:e.target.value})}><option value="">Выберите…</option>{options.map(v=><option key={v}>{v}</option>)}</select>:<input autoComplete="off" inputMode={name==='port'?'numeric':'text'} value={config[name]??''} onChange={e=>setConfig({...config,[name]:e.target.value})}/>}</label>;
const covered=DEPARTMENTS.filter(([id])=>state.devices.some(d=>d.connected&&DEVICES.find(m=>m.id===d.id).department===id));const broken=state.devices.find(d=>d.fault);const missions=[['Подключите первый прибор · +25',state.connectedOnce.length>0],['Подключите по одному прибору каждого отдела',covered.length===5],['Выдайте 10 результатов · бонус +100',state.released>=10],['Выдайте 50 результатов · бонус +250',state.released>=50]];const nextStep=broken?'Открыта сервисная заявка. Откройте его и выберите подходящее решение.':covered.length<5?'Подключите приборы в отделах: '+DEPARTMENTS.filter(([id])=>!covered.some(d=>d[0]===id)).map(d=>d[1]).join(', ')+'. Достаточно одного на отдел.':state.results.length?'Готова партия! Нажмите «Проверить и выдать партию», чтобы получить очки.':!state.running?'Всё готово. Запустите поток — сортер сам распределит пробирки.':'Лаборатория работает. Дождитесь результатов — кофе пока можно только виртуальный.';
return <section className="lab-game"><div className="lab-heading"><div><span className="eyebrow">ICM // ENGINEERING SANDBOX</span><h1>LIS CONNECTION / СМЕНА ИНЖЕНЕРА</h1><p>Подключите приборы → запустите сортер → восстановите связь → выдайте результаты.</p></div><button className="outline-button" onClick={()=>setHelp(!help)}>Как играть</button></div>
{help&&<div className="lab-guide"><h2>Ваша задача — запустить лабораторию</h2><ol><li>В ICM найдите назначенный прибору порт. Адрес сервера общий: 192.0.2.10.</li><li>Откройте статью прибора в Redmine. По инструкции настройте соединение и обмен в игровой панели.</li><li>Подключите хотя бы один прибор каждого отдела и запустите поток.</li><li>При сбое выберите действие по сообщению журнала. Ошибки не отнимают очки, а пробирки сохраняются.</li><li>Выдавайте готовые партии. После пяти минут приёма лаборатория дорабатывает очередь.</li></ol><p>Подключение моделируется локально. Адреса, назначенные порты, время измерений и трек — условия игры. Параметры обмена взяты из указанных статей; это не инструкция для вмешательства в реальное оборудование.</p></div>}
<div className="icm-banner"><div><span className="eyebrow">ВАШ СЕРВЕР LIS</span><strong>192.0.2.10</strong><span>10 приборов · 5 отделов · документация Redmine</span></div><button className="primary" onClick={()=>setIcm(!icm)}>{icm?'Закрыть ICM':'Открыть сервис ICM →'}</button></div>
{icm&&<section className="icm-registry"><h2>ICM / установленные анализаторы</h2><p>Порты назначены для этой учебной лаборатории. Сетевые реквизиты MOXA — адреса установленных преобразователей.</p><div className="table-wrap"><table><thead><tr><th>Анализатор</th><th>Драйвер ICM</th><th>Порт сервера</th><th>MOXA / канал</th><th>Связь</th></tr></thead><tbody>{DEVICES.map((m,i)=><tr key={m.id}><td><button className="table-link" onClick={()=>{setSelected(m.id);setIcm(false);}}>{m.maker} {m.name}</button></td><td>{m.driver}</td><td><code>{m.passport.port}</code></td><td>{m.passport.moxa?m.passport.moxa+' / '+m.passport.channel:'—'}</td><td>{state.devices[i].connected?'● Подключен':'○ Ожидает настройки'}</td></tr>)}</tbody></table></div></section>}
<div className="lab-coach"><strong>Ваш следующий шаг</strong><p>{nextStep}</p>{broken&&<button className="outline-button" onClick={()=>setSelected(broken.id)}>Помочь {DEVICES.find(d=>d.id===broken.id).name} →</button>}<small>Спокойная смена: новая поломка не чаще раза в 2,5 минуты и только одна за раз. Ошибки не отнимают очки.</small></div><div className="lab-toolbar"><button className="primary" disabled={state.finished} onClick={()=>dispatch({type:'toggle'})}>{state.running?'Ⅱ Пауза':'▶ '+(state.time?'Продолжить':'Запустить поток')}</button><span className="lab-clock">{time(state.time)} / {state.mode==='endless'?'∞':'05:00'}</span><span>{state.finished?'Смена завершена':state.time>300&&state.mode==='shift'?'Доработка очереди':state.running?'Поток активен':'На паузе'}</span><button className="text-button" onClick={()=>{dispatch({type:'pause'});setReset(true);}}>Новая смена</button></div>
{reset&&<div className="lab-guide"><p>Начать новую смену? Текущая учебная партия будет сброшена.</p><button className="outline-button" onClick={()=>{dispatch({type:'reset',mode:'shift'});setConfig(emptyConfig());setReset(false);}}>Смена 5 минут</button> <button className="outline-button" onClick={()=>{dispatch({type:'reset',mode:'endless'});setConfig(emptyConfig());setReset(false);}}>Бесконечный поток</button> <button className="text-button" onClick={()=>setReset(false)}>Отмена</button></div>}
<div className="lab-metrics">{[['На связи',connected+'/10'],['Принято',state.received],['В очереди',state.queue.length],['Готово к выдаче',state.results.length],['Выдано',state.released],['Очки смены',state.score]].map(([l,v])=><div key={l}><strong>{v}</strong><span>{l}</span></div>)}</div>
<div className="lab-map-wrap"><svg className="lab-map" viewBox="0 0 1040 575" role="img" aria-label="План лаборатории: пять отделов, десять анализаторов, сортер и трек пробирок"><defs><pattern id="lab-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#15333c" strokeWidth=".5"/></pattern><pattern id="lab-belt" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 0V18" stroke="#456273" strokeWidth="3"/></pattern></defs><rect x="0" y="0" width="1040" height="575" fill="#09151e"/><rect width="1040" height="575" fill="url(#lab-grid)"/>
{DEPARTMENTS.map(([id,name,color],i)=><g key={id}><rect x={i*190+15} y="52" width="174" height="490" rx="6" fill={color+'09'} stroke={color+'50'}/><text x={i*190+102} y="82" textAnchor="middle" fill={color} fontSize="13">{name}</text><text x={i*190+102} y="525" textAnchor="middle" fill="#88a1b4" fontSize="10">ОЧЕРЕДЬ: {state.queue.filter(t=>t.department===id).length}</text></g>)}
<text x="24" y="30" fill="#56e5d6" fontSize="13">LIS // ЛАБОРАТОРНЫЙ КОРПУС 01</text><text x="820" y="30" fill="#86a2af" fontSize="11">ПРОБИРКИ → РЕЗУЛЬТАТЫ</text>
<path d="M44 300H1000" stroke="#40606d" strokeWidth="28"/><path d="M44 300H1000" stroke="url(#lab-belt)" strokeWidth="20"/>
{DEVICES.map((m,i)=>{const d=state.devices[i];return <g key={m.id}><path d={`M${m.x} 300V${m.y}`} stroke="#355466" strokeWidth="16"/><path d={`M${m.x} 300V${m.y}`} stroke={m.color} strokeWidth="2" strokeDasharray="5 8" opacity=".6"/><g role="button" tabIndex="0" aria-label={`${m.name} ${m.maker}: ${d.fault?'Авария':d.connected?'Подключен':'Отключен'}`} onClick={()=>setSelected(m.id)} onKeyDown={e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();setSelected(m.id);}}} className="lab-machine" transform={`translate(${m.x-69},${m.y-60})`}><rect width="138" height="112" rx="8" fill="#142a38" stroke={selected===m.id?'#fff':d.fault?'#ff687f':m.color} strokeWidth={selected===m.id?3:1.5}/><rect x="9" y="9" width="65" height="49" rx="4" fill="#243f4e" stroke="#537283"/>{m.department==='elisa'?<g>{Array.from({length:24},(_,j)=><circle key={j} cx={20+j%6*8} cy={19+Math.floor(j/6)*9} r="2.5" fill={m.color}/>)}</g>:m.department==='hema'?<g>{[0,1,2,3].map(j=><rect key={j} x={19+j*13} y="18" width="7" height="31" rx="3" fill={m.color} opacity={.35+j*.18}/>)}</g>:m.department==='coag'?<g>{[0,1,2,3].map(j=><g key={j}><circle cx={22+j*12} cy="27" r="4" fill={m.color}/><path d={'M'+(22+j*12)+' 33v15'} stroke={m.color}/></g>)}</g>:<circle cx="40" cy="33" r="17" fill="#101f2b" stroke={m.color}/>}
<g className={d.job&&d.connected&&state.running?'rotor spinning':'rotor'} style={{transformOrigin:'40px 33px'}}>{(m.department==='bio'||m.department==='clia'?[0,60,120,180,240,300]:[]).map(a=><circle key={a} cx={40+11*Math.cos(a*Math.PI/180)} cy={33+11*Math.sin(a*Math.PI/180)} r="3" fill={m.color}/>)}</g><rect x="83" y="10" width="44" height="30" rx="2" fill="#041519" stroke="#3c6b75"/><text x="105" y="29" textAnchor="middle" fill={d.fault?'#ff687f':'#68ffd2'} fontSize="10">{d.fault?'ERR':d.job?d.remaining+'s':'LIS'}</text><circle cx="121" cy="50" r="4" fill={d.fault?'#ff687f':d.connected?'#64ffae':'#758290'}/><text x="10" y="74" fill="#f0f7fc" fontSize="12">{m.maker}</text><text x="10" y="92" fill={m.color} fontSize="12">{m.name}</text><rect x="10" y="101" width={118*(d.job?1-d.remaining/m.seconds:0)} height="3" fill={m.color}/></g></g>})}
<g transform="translate(8,265)"><rect width="66" height="70" rx="6" fill="#263044" stroke="#e3bb6b"/><text x="33" y="22" textAnchor="middle" fill="#ffdd90" fontSize="10">СОРТЕР</text>{[0,1,2,3].map(i=><g key={i}><rect x={10+i*12} y="33" width="7" height="20" rx="3" fill="#b6d5e5"/><rect x={10+i*12} y="31" width="7" height="5" fill={DEPARTMENTS[i][2]}/></g>)}</g>
<g transform="translate(960,350)"><rect width="66" height="150" rx="5" fill="#182d3b" stroke="#52c9da"/><text x="33" y="23" textAnchor="middle" fill="#74e9f0" fontSize="12">LIS</text>{[0,1,2,3].map(i=><g key={i}><rect x="9" y={36+i*22} width="48" height="16" fill="#0b1a23"/><circle cx="48" cy={44+i*22} r="2" fill="#6bffc5"/></g>)}</g>
{state.tubes.map(t=>{const p=tubePosition(t);return <g key={t.id} className="moving-tube" transform={`translate(${p.x},${p.y})`}><title>Пробирка {t.id} → {DEVICES.find(d=>d.id===t.device).name}</title><rect x="-5" y="-11" width="10" height="22" rx="4" fill="#d7eaf0" stroke="#031925"/><rect x="-5" y="-12" width="10" height="6" fill={DEPARTMENTS.find(d=>d[0]===t.department)[2]}/></g>})}</svg></div>
<p className="map-caption">Цвет = отдел · зелёный индикатор = связь · красный = авария · пробирки движутся от сортера к приборам. На узком экране план прокручивается.</p>
<div className="lab-device-tabs" aria-label="Выбор анализатора">{DEVICES.map((m,i)=><button className={selected===m.id?'selected':''} key={m.id} onClick={()=>setSelected(m.id)}><i className={state.devices[i].fault?'fault':state.devices[i].connected?'online':''}/>{m.name}<small>{m.maker}</small></button>)}</div>
<div className="lab-panels"><section className="lab-console"><div className="lab-panel-title"><h2>{model.maker} / {model.name}</h2><span className={fault?'status-bad':'status-good'}>{fault?'Авария':device.connected?'Подключен':'Не подключен'}</span></div><a className="instrument-source" href={model.source} target="_blank" rel="noreferrer">↗ Инструкция {model.name} в Redmine</a>
{fault?<div className="fault-console friendly-repair"><span className="eyebrow">СЕРВИСНАЯ ЗАЯВКА / ВЫБЕРИТЕ РЕШЕНИЕ</span><h3>{fault.title}</h3><pre>{fault.log}</pre><p className="lab-joke">{REPAIR_HELP[fault.id].joke}</p><div className="repair-options">{FAULTS.filter(f=>f.id===fault.id||f.id===(fault.id==='link'?'ack':'link')||f.id===(['link','ack'].includes(fault.id)?'reagent':'ack')).sort((a,b)=>a.id.localeCompare(b.id)).map(f=><button className="outline-button" key={f.id} onClick={()=>dispatch({type:'repair-choice',id:selected,choice:f.id})}>{REPAIR_HELP[f.id].action}</button>)}</div><p className="case-feedback" aria-live="polite">{state.log[0]?.text}</p><small>Ремонт бесплатный. При неверном выборе очередь сохраняется.</small></div>:<form onSubmit={e=>{e.preventDefault();dispatch({type:'connect',id:selected,config});}}><div className="connection-fields">{Object.keys(model.passport).map(name=>field(name,FIELD_LABELS[name]||name,FIELD_OPTIONS[name]))}</div><button className="primary" type="submit">Сохранить и проверить обмен</button></form>}
<p className="device-counter">Обработано прибором: {device.done} · {device.job?'Пробирка #'+device.job.id:'Загрузчик свободен'}</p></section>
<section className="lab-console"><h2>Диспетчер смены</h2><p className="lab-joke">План простой: подключаем, исследуем, выдаём. Паника в комплект не входит.</p><div className="lab-missions">{missions.map(([title,done])=><div key={title} className={done?'complete':''}><span>{done?'✓':'○'}</span>{title}</div>)}</div><div className="lab-economy"><strong>Бонусы без мелкого шрифта</strong><span>+25 за первое подключение каждого прибора</span><span>+15 за выданную пробирку</span><span>+50 за устранение случайной поломки</span><span>Ремонт бесплатный. Переполнение ставит приём на паузу.</span></div><h3>Партия результатов · {state.results.length}</h3><p>Учебная проверка: идентификаторы пробирок сохранены, результаты получены. Выдача приносит 15 очков за пробирку. Первые 10 результатов дают ещё +100, а 50 результатов — +250.</p><div className="result-chips">{state.results.slice(-12).map(t=><span key={t.id}>#{t.id} · {t.device}</span>)}</div><button className="primary" disabled={!state.results.length} onClick={()=>dispatch({type:'release'})}>Проверить и выдать партию</button><div className="lab-summary"><span>Ремонты: {state.repairs}</span><span>Попытки настройки: {state.errors}</span><span>Ранее не принято: {state.lost}</span></div><details><summary>Тренировка аварии</summary><p>Необязательная тренировка. Создаёт одну неисправность, для которой нужно выбрать подходящее решение. За тренировочный ремонт очки не начисляются.</p><button className="outline-button" disabled={!device.connected||Boolean(broken)} onClick={()=>dispatch({type:'incident',id:selected,fault:model.passport.transport==='RS-232'?'serial':'ack'})}>Создать учебную неисправность</button></details><small>{saveError?'Не удалось сохранить: хранилище браузера недоступно.':'Смена сохраняется в этом браузере. При возвращении — пауза.'} Очки игры отдельные от рейтингового XP.</small></section></div>
<section className="lab-log"><h2>Журнал событий</h2><div role="status">{state.log[0]?.text}</div>{state.log.map((entry,i)=><p key={i}><time>{time(entry.time)}</time>{entry.text}</p>)}</section></section>;
}
