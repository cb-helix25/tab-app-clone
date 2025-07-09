const fs = require('fs');
// invisible change 2
const path = require('path');

const teamPath = path.join(__dirname, '..', 'data', 'team-sql-data.json');
const outputPath = path.join(__dirname, '..', 'src', 'localData', 'localAttendance.json');

const team = JSON.parse(fs.readFileSync(teamPath, 'utf-8'));
const active = team.filter(m => (m.status || '').toLowerCase() === 'active');

function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatWeekRange(monday) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = d => d.toLocaleDateString('en-GB');
    return `Monday, ${fmt(monday)} - Sunday, ${fmt(sunday)}`;
}

function getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return Math.round(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7) + 1;
}

function randomAttendance() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const selected = days.filter(() => Math.random() < 0.75);
    return selected.join(',');
}

const now = new Date();
const currentMonday = startOfWeek(now);
const nextMonday = new Date(currentMonday); nextMonday.setDate(currentMonday.getDate() + 7);

const currentRange = formatWeekRange(currentMonday);
const nextRange = formatWeekRange(nextMonday);

const output = {
    attendance: active.map(m => ({
        name: m['Full Name'] || `${m.First} ${m.Last}`,
        level: m.Role || '',
        weeks: {
            [currentRange]: { iso: getISOWeek(currentMonday), attendance: randomAttendance() },
            [nextRange]: { iso: getISOWeek(nextMonday), attendance: randomAttendance() }
        }
    })),
    team: active.map(m => ({
        First: m.First,
        Initials: m.Initials,
        'Entra ID': m['Entra ID'],
        Nickname: m.Nickname || ''
    }))
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log('localAttendance.json generated with', output.attendance.length, 'records');
