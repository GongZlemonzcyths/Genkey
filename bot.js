const { Client, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const CHANNEL_ID = '1290612497254060106'; // แทนที่ด้วย ID ของช่องที่บอทจะส่งข้อความ
const BUTTON_ID_GENERATE = 'genkey_button'; // รหัสปุ่มสำหรับสร้างคีย์
const BUTTON_ID_REDEEM = 'redeem_button'; // รหัสปุ่มสำหรับ redeem คีย์
const BUTTON_ID_INFO = 'info_button'; // รหัสปุ่มสำหรับดูข้อมูล

let redeemedKeys = []; // อาร์เรย์เก็บคีย์ที่ถูก redeem

client.once('ready', async() => {
    console.log(`Logged in as ${client.user.tag}!`);
    await sendMessageWithButton();
});

// ฟังก์ชันสำหรับส่งข้อความที่มีปุ่ม
async function sendMessageWithButton() {
    const channel = await client.channels.fetch(CHANNEL_ID); // ดึงช่องที่ต้องการส่งข้อความ

    const buttonGenerate = new ButtonBuilder()
        .setCustomId(BUTTON_ID_GENERATE) // รหัสปุ่มสร้างคีย์
        .setLabel('Generate Key') // ข้อความที่แสดงบนปุ่ม
        .setStyle(ButtonStyle.Primary); // รูปแบบของปุ่ม

    const buttonRedeem = new ButtonBuilder()
        .setCustomId(BUTTON_ID_REDEEM) // รหัสปุ่ม redeem
        .setLabel('Redeem Key') // ข้อความที่แสดงบนปุ่ม
        .setStyle(ButtonStyle.Success); // รูปแบบของปุ่ม

    const buttonInfo = new ButtonBuilder()
        .setCustomId(BUTTON_ID_INFO) // รหัสปุ่มดูข้อมูล
        .setLabel('Info') // ข้อความที่แสดงบนปุ่ม
        .setStyle(ButtonStyle.Secondary); // รูปแบบของปุ่ม

    const row = new ActionRowBuilder()
        .addComponents(buttonGenerate, buttonRedeem, buttonInfo); // เพิ่มปุ่มทั้งหมดใน Action Row

    await channel.send({
        content: 'Click a button to perform an action:',
        components: [row], // ส่ง Action Row ที่มีปุ่ม
    });
}

// ฟังก์ชันสำหรับสร้างคีย์
function generateKey(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }

    return result;
}

// รับการแจ้งเตือนเมื่อผู้ใช้กดปุ่ม
client.on('interactionCreate', async interaction => {
    if (interaction.customId === BUTTON_ID_GENERATE) {
        const newKey = generateKey();
        await interaction.deferUpdate(); // รอการอัปเดต
        await interaction.channel.send(`Generated key: ${newKey}`); // ตอบกลับด้วยคีย์ที่สร้างขึ้น

    } else if (interaction.customId === BUTTON_ID_REDEEM) {
        // สร้างโมดัลสำหรับกรอกคีย์
        const modal = new ModalBuilder()
            .setCustomId('redeem_modal')
            .setTitle('Redeem Key');

        const keyInput = new TextInputBuilder()
            .setCustomId('key_input')
            .setLabel('Enter your key:')
            .setStyle(TextInputStyle.Short);

        const row = new ActionRowBuilder().addComponents(keyInput);
        modal.addComponents(row);

        await interaction.showModal(modal); // แสดงโมดัล
    } else if (interaction.customId === BUTTON_ID_INFO) {
        await interaction.deferUpdate(); // รอการอัปเดต
        if (redeemedKeys.length > 0) {
            await interaction.channel.send(`Use keys: ${redeemedKeys.join(', ')}`);
        } else {
            await interaction.channel.send('No keys have been redeemed yet.');
        }
    }
});

// รับการแจ้งเตือนเมื่อโมดัลถูกส่ง
client.on('interactionCreate', async interaction => {
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'redeem_modal') {
        const keyToRedeem = interaction.fields.getTextInputValue('key_input'); // ดึงค่าจากโมดัล
        if (keyToRedeem && !redeemedKeys.includes(keyToRedeem)) {
            redeemedKeys.push(keyToRedeem); // เพิ่มคีย์ที่ถูก redeem ลงในอาร์เรย์
            await interaction.reply({ content: `Redeemed key: ${keyToRedeem}`, ephemeral: true }); // ตอบกลับด้วยคีย์ที่ถูก redeem
        } else {
            await interaction.reply({ content: `This key is already redeemed or not valid.`, ephemeral: true });
        }
    }
});

client.login(process.env.BOT_TOKEN);