// scripts/seedLocations.js — Seeds all Indian states + districts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { StateMaster } from "../models/stateMaster.js";
import { DistrictMaster } from "../models/districtMaster.js";

const LOCATIONS = [
  { id:"AP", name:"Andhra Pradesh", districts:["Anakapalli","Anantapur","Bapatla","Chittoor","East Godavari","Eluru","Guntur","Kadapa","Kakinada","Konaseema","Krishna","Kurnool","Manyam","Nandyal","NTR","Palnadu","Parvathipuram","Prakasam","Sri Balaji","Sri Sathya Sai","Srikakulam","Tirupati","Visakhapatnam","Vizianagaram","West Godavari"] },
  { id:"AR", name:"Arunachal Pradesh", districts:["Anjaw","Changlang","Dibang Valley","East Kameng","East Siang","Kamle","Kra Daadi","Kurung Kumey","Lepa Rada","Lohit","Longding","Lower Dibang Valley","Lower Siang","Lower Subansiri","Namsai","Pakke Kessang","Papum Pare","Shi Yomi","Siang","Tawang","Tirap","Upper Dibang Valley","Upper Siang","Upper Subansiri","West Kameng","West Siang"] },
  { id:"AS", name:"Assam", districts:["Bajali","Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara-Mankachar","Tamulpur","Tinsukia","Udalguri","West Karbi Anglong"] },
  { id:"BR", name:"Bihar", districts:["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"] },
  { id:"CG", name:"Chhattisgarh", districts:["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada","Dhamtari","Durg","Gariaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur","Kabirdham","Kanker","Khairagarh","Kondagaon","Korba","Koriya","Mahasamund","Manendragarh","Mohla-Manpur","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sarangarh-Bilaigarh","Sukma","Surajpur","Surguja"] },
  { id:"GA", name:"Goa", districts:["North Goa","South Goa"] },
  { id:"GJ", name:"Gujarat", districts:["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad","Chhota Udaipur","Dahod","Dang","Devbhumi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad"] },
  { id:"HR", name:"Haryana", districts:["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"] },
  { id:"HP", name:"Himachal Pradesh", districts:["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul Spiti","Mandi","Shimla","Sirmaur","Solan","Una"] },
  { id:"JH", name:"Jharkhand", districts:["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahebganj","Seraikela Kharsawan","Simdega","West Singhbhum"] },
  { id:"KA", name:"Karnataka", districts:["Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban","Bidar","Chamarajanagar","Chikballapur","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Vijayanagara","Yadgir"] },
  { id:"KL", name:"Kerala", districts:["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"] },
  { id:"MP", name:"Madhya Pradesh", districts:["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Maihar","Mandla","Mandsaur","Morena","Mauganj","Narsinghpur","Neemuch","Niwari","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"] },
  { id:"MH", name:"Maharashtra", districts:["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"] },
  { id:"MN", name:"Manipur", districts:["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"] },
  { id:"ML", name:"Meghalaya", districts:["East Garo Hills","East Jaintia Hills","East Khasi Hills","Eastern West Khasi Hills","North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills"] },
  { id:"MZ", name:"Mizoram", districts:["Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit","Saiha","Saitual","Serchhip"] },
  { id:"NL", name:"Nagaland", districts:["Chumoukedima","Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Niuland","Noklak","Peren","Phek","Shamator","Tseminyu","Tuensang","Wokha","Zunheboto"] },
  { id:"OD", name:"Odisha", districts:["Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara","Kendujhar","Khordha","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Subarnapur","Sundargarh"] },
  { id:"PB", name:"Punjab", districts:["Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur","Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa","Moga","Mohali","Muktsar","Pathankot","Patiala","Rupnagar","Sangrur","Shaheed Bhagat Singh Nagar","Tarn Taran"] },
  { id:"RJ", name:"Rajasthan", districts:["Ajmer","Alwar","Banswara","Baran","Barmer","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Dholpur","Dungarpur","Hanumangarh","Jaipur","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Karauli","Kota","Nagaur","Pali","Pratapgarh","Rajsamand","Sawai Madhopur","Sikar","Sirohi","Sri Ganganagar","Tonk","Udaipur"] },
  { id:"SK", name:"Sikkim", districts:["Gangtok","Gyalshing","Mangan","Namchi","Pakyong","Soreng"] },
  { id:"TN", name:"Tamil Nadu", districts:["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Kanyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar"] },
  { id:"TS", name:"Telangana", districts:["Adilabad","Bhadradri Kothagudem","Hanmakonda","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Kumuram Bheem","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal","Yadadri Bhuvanagiri"] },
  { id:"TR", name:"Tripura", districts:["Dhalai","Gomati","Khowai","North Tripura","Sepahijala","Sipahijala","South Tripura","Unakoti","West Tripura"] },
  { id:"UP", name:"Uttar Pradesh", districts:["Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Prayagraj","Raebareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shrawasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"] },
  { id:"UK", name:"Uttarakhand", districts:["Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"] },
  { id:"WB", name:"West Bengal", districts:["Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling","Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman","Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"] },
  { id:"AN", name:"Andaman and Nicobar Islands", districts:["Nicobar","North and Middle Andaman","South Andaman"] },
  { id:"CH", name:"Chandigarh", districts:["Chandigarh"] },
  { id:"DN", name:"Dadra and Nagar Haveli and Daman and Diu", districts:["Dadra and Nagar Haveli","Daman","Diu"] },
  { id:"DL", name:"Delhi", districts:["Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"] },
  { id:"JK", name:"Jammu and Kashmir", districts:["Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar","Kulgam","Kupwara","Poonch","Pulwama","Rajouri","Ramban","Reasi","Samba","Shopian","Srinagar","Udhampur"] },
  { id:"LA", name:"Ladakh", districts:["Kargil","Leh"] },
  { id:"LD", name:"Lakshadweep", districts:["Lakshadweep"] },
  { id:"PY", name:"Puducherry", districts:["Karaikal","Mahe","Puducherry","Yanam"] },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await StateMaster.deleteMany({});
    await DistrictMaster.deleteMany({});
    console.log("Cleared existing location data");

    for (const loc of LOCATIONS) {
      await StateMaster.create({ state_id: loc.id, state_name: loc.name });

      const districts = loc.districts.map((name, i) => ({
        state_id: loc.id,
        district_id: `${loc.id}${String(i + 1).padStart(2, "0")}`,
        district_name: name,
      }));
      await DistrictMaster.insertMany(districts);
      console.log(`✓ ${loc.name} — ${districts.length} districts`);
    }

    console.log("\n✅ All states and districts seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
})();
