/**
 * Targeted tests for the v1.0.19–v1.0.25 buttons pipeline changes.
 * Run: node --test test/buttons-pipeline.test.mjs
 *
 * Covers lib/Utils/messages.js (buttons API: classic + nativeFlow, rows/sections
 * sheets, url/copy/call actions, invisible-PNG auto headers for both the `buttons`
 * API and raw `buttonsMessage`) with a mocked upload pipeline — no network.
 */
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const FAKE_LOGGER = {
    child() { return this },
    info() {}, debug() {}, warn() {}, error() {}
}

const okOptions = async () => ({
    logger: FAKE_LOGGER,
    mediaCache: new Map(),
    upload: async () => ({
        mediaUrl: 'https://mmg.mock/invisible.png',
        directPath: '/v/t62.7118-24/mock.png'
    })
})

const failOptions = async () => ({
    logger: FAKE_LOGGER,
    mediaCache: new Map(),
    upload: async () => { throw new Error('network down') }
})

let gen, proto

before(async () => {
    ;({ generateWAMessageContent: gen } = await import('../lib/Utils/messages.js'))
    ;({ proto } = await import('../WAProto/index.js'))
})

const Btn = () => proto.Message.ButtonsMessage.Button.Type

describe('buttons API — classic horizontal row (auto headers)', () => {
    test('text-only gets the invisible PNG image header (no "not supported" bubble)', async () => {
        const m = await gen({
            text: 'Pong 9 Ms', footer: 'BOT',
            buttons: [{ buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }]
        }, await okOptions())

        const bm = m.buttonsMessage
        assert.ok(bm, 'buttonsMessage expected')
        assert.ok(bm.imageMessage, 'invisible PNG header expected')
        assert.equal(bm.headerType, 4) // IMAGE
        assert.equal(bm.buttons.length, 1)
        assert.equal(bm.buttons[0].buttonId, 'menu')
        assert.equal(bm.buttons[0].type, Btn().RESPONSE)
    })

    test('upload failure falls back gracefully instead of throwing', async () => {
        const m = await gen({
            text: 'Pong',
            buttons: [{ buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }]
        }, await failOptions())

        assert.ok(m.buttonsMessage)
        assert.equal(m.buttonsMessage.buttons.length, 1)
    })

    test('plain buttons stay RESPONSE type with no nativeFlowInfo', async () => {
        const m = await gen({
            text: 'hi',
            buttons: [{ buttonText: { displayText: 'ok' }, buttonId: 'ok', type: 1 }]
        }, await okOptions())

        const btn = m.buttonsMessage.buttons[0]
        assert.ok(!btn.nativeFlowInfo)
        assert.equal(btn.type, Btn().RESPONSE)
    })
})

describe('buttons API — tap-to-open list sheet (rows / sections)', () => {
    test('button `rows` builds a single_select sheet with highlight + rowIds (upgraded to native flow card)', async () => {
        // v1.0.26: any button carrying rows/sections upgrades the WHOLE message
        // to a native-flow interactive card — a classic ButtonsMessage mixed
        // with native-flow extras renders as "version doesn't support it".
        const m = await gen({
            text: 'hi',
            buttons: [{
                buttonText: { displayText: '📂 allmenus' }, buttonId: 'allmenus', type: 1,
                highlightLabel: '⭐ MAIN',
                rows: [{ title: 'Download', description: 'd', rowId: '.download' }, { title: 'AI', rowId: '.ai' }]
            }]
        }, await okOptions())

        const im = m.interactiveMessage
        assert.ok(im, 'rows on a button must upgrade the message to native flow')
        const fb = im.nativeFlowMessage.buttons[0]
        assert.equal(fb.name, 'single_select')
        const sheet = JSON.parse(fb.buttonParamsJson)
        assert.equal(sheet.title, '📂 allmenus')
        assert.equal(sheet.sections.length, 1)
        assert.equal(sheet.sections[0].highlight_label, '⭐ MAIN')
        assert.equal(sheet.sections[0].rows[0].id, '.download')
        assert.equal(sheet.sections[0].rows[1].id, '.ai')
    })

    test('button `sections` keeps multiple sections with their own badges (native flow)', async () => {
        const m = await gen({
            text: 'hi',
            buttons: [{
                buttonText: { displayText: 'open' }, buttonId: 'open', type: 1,
                sections: [
                    { title: 'S1', highlight_label: '⭐ MAIN', rows: [{ title: 'A', rowId: 'a' }] },
                    { title: 'S2', rows: [{ title: 'B', rowId: 'b' }] }
                ]
            }]
        }, await okOptions())

        const im = m.interactiveMessage
        assert.ok(im, 'sections on a button must upgrade to native flow')
        const sheet = JSON.parse(im.nativeFlowMessage.buttons[0].buttonParamsJson)
        assert.equal(sheet.sections.length, 2)
        assert.equal(sheet.sections[0].highlight_label, '⭐ MAIN')
        assert.equal(sheet.sections[1].highlight_label, undefined)
    })
})

describe('buttons API — one-click action buttons (url / copy / call)', () => {
    test('`url` upgrades the message to native flow with a cta_url button', async () => {
        const m = await gen({
            text: 'hi',
            buttons: [{ buttonText: { displayText: '📢 Channel' }, url: 'https://whatsapp.com/channel/x' }]
        }, await okOptions())

        const im = m.interactiveMessage
        assert.ok(im, 'url button must upgrade the message to native flow')
        const fb = im.nativeFlowMessage.buttons[0]
        assert.equal(fb.name, 'cta_url')
        const params = JSON.parse(fb.buttonParamsJson)
        assert.equal(params.url, 'https://whatsapp.com/channel/x')
        assert.equal(params.display_text, '📢 Channel')
    })

    test('`copy` becomes cta_copy with the copy code (native flow)', async () => {
        const m = await gen({
            text: 'hi',
            buttons: [{ buttonText: { displayText: '🎁 Voucher' }, copy: 'ISHAN2026' }]
        }, await okOptions())

        const fb = m.interactiveMessage.nativeFlowMessage.buttons[0]
        assert.equal(fb.name, 'cta_copy')
        assert.equal(JSON.parse(fb.buttonParamsJson).copy_code, 'ISHAN2026')
    })

    test('`call` becomes cta_call with the phone number (native flow)', async () => {
        const m = await gen({
            text: 'hi',
            buttons: [{ buttonText: { displayText: '📞 Call' }, call: '919999999999' }]
        }, await okOptions())

        const fb = m.interactiveMessage.nativeFlowMessage.buttons[0]
        assert.equal(fb.name, 'cta_call')
        assert.equal(JSON.parse(fb.buttonParamsJson).phone_number, '919999999999')
    })

    test('plain + sheet + action buttons mix in one native-flow card', async () => {
        const m = await gen({
            text: 'hi',
            buttons: [
                { buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 },
                { buttonText: { displayText: 'pick' }, buttonId: 'pick', rows: [{ title: 'r', rowId: '.r' }] },
                { buttonText: { displayText: 'go' }, url: 'https://example.com' }
            ]
        }, await okOptions())

        const im = m.interactiveMessage
        assert.ok(im, 'mix with sheet/action must upgrade to native flow')
        assert.deepEqual(im.nativeFlowMessage.buttons.map(b => b.name), ['quick_reply', 'single_select', 'cta_url'])
    })
})

describe('location / gif headers', () => {
    test('location header builds the map card (headerType LOCATION) with no uploads', async () => {
        const m = await gen({
            location: { degreesLatitude: 9.9312, degreesLongitude: 76.2673, name: 'BOT', address: 'pick one' },
            text: 'Pong',
            buttons: [{ buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }]
        }, await okOptions())

        const bm = m.buttonsMessage
        assert.equal(bm.headerType, 6) // LOCATION
        assert.ok(Math.abs(bm.locationMessage.degreesLatitude - 9.9312) < 1e-6)
        assert.ok(Math.abs(bm.locationMessage.degreesLongitude - 76.2673) < 1e-6)
    })

    test('gif key maps to a VIDEO header with gifPlayback (source contract)', () => {
        // exercising the real gif branch would fetch the remote stream before the
        // mocked upload — verify the mapping contract in source instead:
        const src = readFileSync(new URL('../lib/Utils/messages.js', import.meta.url), 'utf8')
        // the classic branch (the one with headerType VIDEO) comes after the
        // interactiveMessage one — take the last occurrence:
        const idx = src.lastIndexOf("else if ('gif' in message")
        assert.ok(idx > -1, "gif branch expected in generateWAMessageContent")
        const branch = src.slice(idx, idx + 600)
        assert.match(branch, /prepareWAMessageMedia\(\{ video: message\.gif \}/)
        assert.match(branch, /gifPlayback = true/)
        assert.match(branch, /ButtonType\.VIDEO/)
    })
})

describe('raw buttonsMessage safety net', () => {
    test('header-less raw message gets the invisible PNG header automatically', async () => {
        const m = await gen({
            buttonsMessage: {
                contentText: 'Pong', footerText: 'BOT',
                buttons: [{ buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }]
            }
        }, await okOptions())

        const bm = m.buttonsMessage
        assert.ok(bm.imageMessage, 'auto header expected on header-less raw message')
        assert.equal(bm.headerType, 4)
    })

    test('raw message WITH an image header is passed through untouched', async () => {
        const m = await gen({
            buttonsMessage: {
                contentText: 'hi', headerType: 4,
                imageMessage: { url: 'https://mmg.whatsapp.net/x', mimetype: 'image/jpeg' },
                buttons: [{ buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }]
            }
        }, await okOptions())

        const bm = m.buttonsMessage
        assert.equal(bm.imageMessage.url, 'https://mmg.whatsapp.net/x')
        assert.equal(bm.headerType, 4)
    })

    test('raw message WITH a location header is passed through untouched', async () => {
        const m = await gen({
            buttonsMessage: {
                contentText: 'hi', headerType: 6,
                locationMessage: { degreesLatitude: 9.9, degreesLongitude: 76.2 },
                buttons: [{ buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }]
            }
        }, await okOptions())

        const bm = m.buttonsMessage
        assert.ok(bm.locationMessage)
        assert.equal(bm.headerType, 6)
    })

    test('upload failure on a header-less raw message does not crash', async () => {
        const m = await gen({
            buttonsMessage: {
                contentText: 'x',
                buttons: [{ buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }]
            }
        }, await failOptions())

        assert.equal(m.buttonsMessage.buttons.length, 1)
    })
})

describe('raw buttonsMessage mixed native-flow upgrade (v1.0.27)', () => {
    test('Case X menu-card: location + single_select + plain buttons → interactive card', async () => {
        const m = await gen({
            buttonsMessage: {
                contentText: 'MENU BODY', footerText: 'YOUHU MD', headerType: 6,
                locationMessage: { degreesLatitude: 0, degreesLongitude: 0, name: 'Youhu base', address: '📍date' },
                buttons: [
                    { buttonId: 'menu', buttonText: { displayText: '☰ menu' }, type: 1,
                      nativeFlowInfo: { name: 'single_select', paramsJson: JSON.stringify({ title: 'Pilih Menu', sections: [{ title: 'sec', highlight_label: '🔥', rows: [{ title: 'ping', description: 'd', id: '/ping' }] }] }) } },
                    { buttonId: 'sc', buttonText: { displayText: '⌕ script' }, type: 1 }
                ]
            }
        }, await okOptions())

        assert.ok(m.interactiveMessage, 'mixed raw should upgrade to interactive card')
        assert.ok(!m.buttonsMessage, 'classic form must not be emitted for mixed raw')
        const im = m.interactiveMessage
        assert.equal(im.nativeFlowMessage.messageVersion, 1)
        assert.equal(im.nativeFlowMessage.buttons.length, 2)
        assert.equal(im.nativeFlowMessage.buttons[0].name, 'single_select')
        const params = JSON.parse(im.nativeFlowMessage.buttons[0].buttonParamsJson)
        assert.equal(params.sections[0].rows[0].id, '/ping')
        assert.equal(im.nativeFlowMessage.buttons[1].name, 'quick_reply')
        assert.equal(im.body.text, 'MENU BODY')
        assert.equal(im.footer.text, 'YOUHU MD')
        assert.ok(im.header.locationMessage, 'location header carried over')
        assert.equal(im.header.hasMediaAttachment, true)
    })

    test('raw plain-only buttonsMessage still stays classic', async () => {
        const m = await gen({
            buttonsMessage: {
                contentText: 'Pong',
                buttons: [{ buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }]
            }
        }, await okOptions())

        assert.ok(m.buttonsMessage, 'plain raw stays classic')
        assert.ok(!m.interactiveMessage)
    })

    test('raw cta_url nativeFlowInfo maps to a cta_url flow button', async () => {
        const m = await gen({
            buttonsMessage: {
                contentText: 'SC',
                buttons: [{ buttonId: 'x', buttonText: { displayText: 'get sc' }, type: 2,
                    nativeFlowInfo: { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'get sc', url: 'https://x.com' }) } }]
            }
        }, await okOptions())

        const im = m.interactiveMessage
        assert.equal(im.nativeFlowMessage.buttons[0].name, 'cta_url')
        assert.equal(JSON.parse(im.nativeFlowMessage.buttons[0].buttonParamsJson).url, 'https://x.com')
    })
})

describe('raw interactiveMessage pass-through (v1.0.27)', () => {
    test('cantarella/Case X raw card passes through, messageVersion defaulted to 1', async () => {
        const m = await gen({
            interactiveMessage: {
                body: { text: 'Pairing code' },
                footer: { text: 'copy it' },
                header: { hasMediaAttachment: false },
                nativeFlowMessage: { buttons: [{ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy', copy_code: 'ABCD' }) }] }
            }
        }, await okOptions())

        const im = m.interactiveMessage
        assert.equal(im.nativeFlowMessage.messageVersion, 1)
        assert.equal(im.nativeFlowMessage.buttons[0].name, 'cta_copy')
        assert.equal(im.body.text, 'Pairing code', 'top-level text must not override an existing body')
        assert.equal(im.footer.text, 'copy it')
    })

    test('short form { interactiveMessage: { buttons } } gets the nativeFlowMessage wrapper', async () => {
        const m = await gen({
            interactiveMessage: { buttons: [{ name: 'quick_reply', buttonParamsJson: '{"display_text":"hi","id":"hi"}' }] }
        }, await okOptions())

        const im = m.interactiveMessage
        assert.ok(im.nativeFlowMessage, 'wrapper added')
        assert.equal(im.nativeFlowMessage.messageVersion, 1)
        assert.equal(im.nativeFlowMessage.buttons[0].name, 'quick_reply')
    })
})

describe('nativeFlow escape hatch', () => {
    test('{ nativeFlow: true } builds vertical quick_reply buttons', async () => {
        const m = await gen({
            text: 'Menu?', nativeFlow: true,
            buttons: [{ buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }]
        }, await okOptions())

        const im = m.interactiveMessage
        assert.ok(im)
        assert.equal(im.nativeFlowMessage.buttons[0].name, 'quick_reply')
        const params = JSON.parse(im.nativeFlowMessage.buttons[0].buttonParamsJson)
        assert.equal(params.id, 'menu')
        assert.equal(params.display_text, 'menu')
    })

    test('nativeFlow + sections button becomes single_select flow button', async () => {
        const m = await gen({
            text: 'hi', nativeFlow: true,
            buttons: [{
                buttonText: { displayText: 'pick' }, buttonId: 'pick',
                sections: [{ title: 'G', highlight_label: '🔥', rows: [{ title: 'r1', rowId: 'x1' }] }]
            }]
        }, await okOptions())

        const fb = m.interactiveMessage.nativeFlowMessage.buttons[0]
        assert.equal(fb.name, 'single_select')
        const sheet = JSON.parse(fb.buttonParamsJson)
        assert.equal(sheet.sections[0].highlight_label, '🔥')
        assert.equal(sheet.sections[0].rows[0].id, 'x1')
    })

    test('nativeFlow + url button becomes cta_url flow button', async () => {
        const m = await gen({
            text: 'hi', nativeFlow: true,
            buttons: [{ buttonText: { displayText: 'web' }, url: 'https://example.com' }]
        }, await okOptions())

        assert.equal(m.interactiveMessage.nativeFlowMessage.buttons[0].name, 'cta_url')
    })
})

describe('mixed native-flow extras upgrade to interactive card (v1.0.26)', () => {
    test('location + rows/url/plain buttons → native-flow card with map header + body', async () => {
        const m = await gen({
            location: { degreesLatitude: 6.9271, degreesLongitude: 79.8612, name: 'ISHAN-X', address: 'Select' },
            text: 'MENU BODY', footer: 'V9',
            buttons: [
                { buttonText: { displayText: '☰ MENU' }, buttonId: 'v9_categories', sectionTitle: '📂 SELECT', highlightLabel: '⭐ MAIN', rows: [{ title: 'Download', rowId: '.downloadmenu' }] },
                { buttonText: { displayText: '👤 OWNER' }, buttonId: 'v9_owner', type: 1 },
                { buttonText: { displayText: '📢 CHANNEL' }, url: 'https://whatsapp.com/channel/x' }
            ]
        }, await okOptions())

        const im = m.interactiveMessage
        assert.ok(im, 'expected native-flow interactive card (classic mixed card is the unsupported bubble)')
        assert.ok(im.header?.locationMessage, 'location header preserved')
        assert.equal(im.header.hasMediaAttachment, true)
        assert.equal(im.body?.text, 'MENU BODY', 'body kept (classic media header drops it)')
        assert.equal(im.nativeFlowMessage.messageVersion, 1)
        assert.deepEqual(im.nativeFlowMessage.buttons.map(b => b.name), ['single_select', 'quick_reply', 'cta_url'])
        const sheet = JSON.parse(im.nativeFlowMessage.buttons[0].buttonParamsJson)
        assert.equal(sheet.sections[0].highlight_label, '⭐ MAIN')
        assert.equal(sheet.sections[0].rows[0].id, '.downloadmenu')
    })

    test('image buffer + url/plain buttons → interactive card with image header', async () => {
        const TINY = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
        const m = await gen({
            image: TINY, caption: 'cap', footer: 'F',
            buttons: [
                { buttonText: { displayText: 'open' }, url: 'https://x.com' },
                { buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 }
            ]
        }, await okOptions())

        const im = m.interactiveMessage
        assert.ok(im, 'mixed buttons with media must upgrade to native flow')
        assert.ok(im.header?.imageMessage, 'image header attached')
        assert.equal(im.nativeFlowMessage.buttons.map(b => b.name).join(','), 'cta_url,quick_reply')
    })

    test('plain-only buttons + location stay classic (proven horizontal path)', async () => {
        const m = await gen({
            location: { degreesLatitude: 9.9, degreesLongitude: 76.2 },
            text: 'Pong',
            buttons: [
                { buttonText: { displayText: 'menu' }, buttonId: 'menu', type: 1 },
                { buttonText: { displayText: 'owner' }, buttonId: 'owner', type: 1 }
            ]
        }, await okOptions())

        assert.ok(m.buttonsMessage, 'plain-only must remain classic ButtonsMessage')
        assert.equal(m.buttonsMessage.headerType, 6)
        assert.equal(m.buttonsMessage.buttons.length, 2)
    })

    test('interactiveButtons default messageVersion = 1 (tappable, not greyed out)', async () => {
        const m = await gen({
            title: 'CARD', text: 'body',
            interactiveButtons: [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'M', id: 'v9' }) }]
        }, await okOptions())

        assert.equal(m.interactiveMessage.nativeFlowMessage.messageVersion, 1)
    })
})

describe('group auto-convert preserves native-flow buttons', () => {
    test('nativeFlowInfo buttons keep their flow name (source contract)', () => {
        const src = readFileSync(new URL('../lib/Socket/messages-send.js', import.meta.url), 'utf8')
        assert.match(src, /btn\.nativeFlowInfo\?\.name/)
        assert.match(src, /name: btn\.nativeFlowInfo\.name/)
        assert.match(src, /buttonParamsJson: btn\.nativeFlowInfo\.paramsJson/)
    })
})
