import Namespace from '../classes/Namespace';

// TODO: 從資料庫取得 namespace 資料
const parentingNs = new Namespace(0, 'parenting', 'https://upload.wikimedia.org/wikipedia/commons/8/85/ParentChildIcon.svg', '/parenting');
const gamingNs = new Namespace(1, 'gaming', 'https://upload.wikimedia.org/wikipedia/commons/0/01/Gaming.png', '/gaming');
const sportsNs = new Namespace(2, 'sports', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Soccerball_shade.svg/250px-Soccerball_shade.svg.png', '/sports');
const namespaces = [parentingNs, gamingNs, sportsNs];

export default namespaces;
