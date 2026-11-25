const assert = require('node:assert/strict');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { _electron: electron } = require('playwright-core');

const password = 'BestBuy audit passphrase';
const dealerEmail = 'audit.dealer@example.com';
const buyerEmail = 'audit.customer@example.com';
const inputs = {
  'Full Name': 'Audit Customer', 'Phone Number': '2135550199',
  'Password': password, 'Confirm Password': password,
};

async function main() {
  const profile = await mkdtemp(join(tmpdir(),'bestbuy-desktop-'));
  let app;
  try {
    app = await electron.launch({
      executablePath: process.env.BESTBUY_TEST_EXECUTABLE || require('electron'),
      args: [...(process.env.BESTBUY_TEST_EXECUTABLE ? [] : [resolve(__dirname,'..')]),`--user-data-dir=${profile}`],
      env: { ...process.env, DATA_ADAPTER:'mock', ELECTRON_START_URL:'static', NODE_ENV:'production', TEST_BOOT:'' },
      timeout: 30_000,
    });
    const page = await app.firstWindow();
    page.setDefaultTimeout(10_000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && !/^Failed to load resource/.test(message.text())) errors.push(message.text());
    });
    const bridge = (channel, ...args) => page.evaluate(({channel,args}) => {
      const [group, method] = channel.split('.');
      return window.electronAPI[group][method](...args);
    }, {channel,args});
    async function good(channel, ...args) {
      const response = await bridge(channel,...args);
      assert(response.success,`${channel}: ${response.error}`);
      return response.data;
    }
    const visible = selector => selector.waitFor({state:'visible'});
    const button = (name, scope = page) => scope.getByRole('button',{name,exact:true});
    const label = name => page.getByLabel(name,{exact:true});
    const signout = async () => {
      await button('Sign Out').click();
      await visible(page.getByRole('heading',{name:'Sign in to your account'}));
    };
    async function login(email, pass = password) {
      await label('Email address').fill(email);
      await label('Password').fill(pass);
      await button('Sign In').click();
      await visible(button('Sign Out'));
    }
    await visible(page.getByRole('heading',{name:'Find your next car.'}));
    if(process.env.BESTBUY_AUDIT_SHOTS) await page.screenshot({path:join(process.env.BESTBUY_AUDIT_SHOTS,'bestbuy-home.png')});
    await page.getByLabel('State or union territory',{exact:true}).selectOption('Andhra Pradesh');
    await page.getByLabel('City',{exact:true}).selectOption('Visakhapatnam');
    await button('Apply location').click();
    await visible(page.getByText(/Visakhapatnam · Coastal Auto Group/).first());
    await page.getByRole('link',{name:'Sign in',exact:true}).click();
    await page.getByRole('link',{name:'Forgot password?',exact:true}).click();
    await visible(page.getByRole('heading',{name:'Recover your account'}));
    await page.getByRole('link',{name:'I have a recovery code'}).click();
    await visible(page.getByRole('heading',{name:'Reset your password'}));
    await page.getByRole('link',{name:'Back to sign in'}).click();
    const preferences = await app.evaluate(({BrowserWindow}) => {
      const {contextIsolation,nodeIntegration,sandbox} = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
      return {contextIsolation,nodeIntegration,sandbox};
    });
    assert.deepEqual(preferences,{contextIsolation:true,nodeIntegration:false,sandbox:true});
    assert.deepEqual(await page.evaluate(()=>({
      require:typeof window.require, process:typeof window.process, ipc:typeof window.ipcRenderer,
      databaseUrl:'DATABASE_URL' in window, genericInvoke:'invoke' in window.electronAPI,
    })),{require:'undefined',process:'undefined',ipc:'undefined',databaseUrl:false,genericInvoke:false});
    assert.equal((await bridge('admin.getStats')).success,false);
    await page.getByRole('link',{name:'Create an account'}).click();
    await button('Create Customer Account').click();
    await visible(page.getByText('Please correct the highlighted fields before submitting.'));
    for (const [field,value] of Object.entries({...inputs,'Email Address':buyerEmail})) await label(field).fill(value);
    await button('Create Customer Account').click();
    await visible(button('Sign Out'));
    await signout();
    await login(buyerEmail);
    await page.getByRole('link',{name:'My Queue',exact:true}).click();
    await visible(page.getByText('You are not currently in any vehicle waitlist queue.'));
    await page.getByRole('link',{name:'Compare Dealers',exact:true}).click();
    await visible(page.getByText('Select Vehicle Model & Variant to Compare:'));
    await page.getByRole('button',{name:/Tata Motors Nexon \(Smart\).*dealers/}).click();
    assert((await page.locator('main tbody tr').count()) > 1);
    await page.getByRole('link',{name:'Browse Cars',exact:true}).click();
    const search = page.getByPlaceholder('Search by brand, model, variant, color, dealership, or city...');
    await search.fill('Impossible vehicle audit search');
    await visible(page.getByText(/No vehicles (match|found)/).first());
    await search.fill('Tata Motors Nexon');
    await visible(page.getByRole('heading',{name:'Tata Motors Nexon',exact:true}).first());
    await signout();
    console.log('Customer registration, validation, login, navigation, search, comparison and empty queue passed.');

    await page.getByRole('link',{name:'Create an account'}).click();
    await page.getByRole('button',{name:/Dealership List vehicles/}).click();
    const dealerInputs = {...inputs,'Full Name':'Audit Dealer','Email Address':dealerEmail,
      'Dealership Commercial Name':'Audit Motors','Dealer Registration / License #':'AUDIT-REG-01',
      'Key Contact Person':'Audit Dealer','Dealership Direct Phone':'2135550198','Showroom Address':'42 Test Road',
      'PIN code':'530016'};
    for (const [field,value] of Object.entries(dealerInputs)) await label(field).fill(value);
    await label('State').selectOption('Andhra Pradesh');
    await label('City').selectOption('Visakhapatnam');
    await button('Register Dealership Account').click();
    try { await visible(button('Sign Out')); }
    catch (error) {
      console.error('Dealer registration feedback:', await page.locator('.bg-red-50').allTextContents());
      throw error;
    }
    await visible(page.getByText('No vehicle listings match the current filters.'));
    assert.equal((await bridge('vehicles.create',{})).success,false);
    await signout();
    await login('admin@bestbuy.example','demo1234');
    await visible(page.getByRole('heading',{name:'Overview',exact:true}));
    await page.getByRole('navigation',{name:'Administration'}).getByRole('link',{name:'Dealers',exact:true}).click();
    const dealerRow = () => page.getByRole('row').filter({hasText:'Audit Motors'});
    await button('Approve',dealerRow()).click();
    await visible(dealerRow().getByText('approved',{exact:true}));
    const registered = (await good('auth.getAllUsers')).find(user=>user.email===buyerEmail);
    assert(registered);
    await signout();
    await login(dealerEmail);
    await button('Add New Vehicle').click();
    await label('Manufacturer / Brand').selectOption('Tata Motors');
    await label('Car Model').selectOption('Nexon');
    await label('Variant / Trim').selectOption('Smart');
    for (const [field,value] of Object.entries({
      'Exterior Colour':'Audit Blue','Ex-Showroom Price':'800000','On-Road Price (Est.)':'900000',
      'Dealer Offer Price (Customer)':'830000','Available Quantity':'2',
    })) await label(field).fill(value);
    await button('Publish Vehicle Listing').click();
    const listingRow = () => page.getByRole('row').filter({hasText:'Audit Blue'});
    await visible(listingRow());
    const [listing] = await good('vehicles.getAll',{dealerId:(await good('auth.getUserById',(await page.evaluate(()=>JSON.parse(localStorage.getItem('bestbuy-auth')).state.user.id)))).dealerProfile.id});
    assert(listing);
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1000,700));
    await listingRow().getByTitle('Edit Vehicle').click();
    const edit = page.getByRole('dialog',{name:'Edit vehicle listing'});
    await visible(edit);
    const dialogSize = await edit.evaluate(node=>({height:node.getBoundingClientRect().height, viewport:innerHeight,scroll:node.scrollHeight-node.clientHeight}));
    assert(dialogSize.height <= dialogSize.viewport);
    await app.evaluate(({BrowserWindow})=>{
      const window = BrowserWindow.getAllWindows()[0];
      window.setMinimumSize(800, 440);
      window.setSize(1000, 440);
    });
    await page.waitForFunction(()=>innerHeight < 470);
    assert(await edit.evaluate(node=>node.scrollHeight > node.clientHeight));
    await app.evaluate(({BrowserWindow})=>{
      const window = BrowserWindow.getAllWindows()[0];
      window.setMinimumSize(1000, 700);
      window.setSize(1000, 700);
    });
    await page.keyboard.press('Escape');
    await edit.waitFor({state:'hidden'});
    await listingRow().getByTitle('Update Price').click();
    const pricing = page.getByRole('dialog',{name:'Update pricing'});
    await pricing.getByLabel('Dealer Offer Price (Customer Final)').fill('842000');
    await pricing.getByRole('button',{name:/Save|Update Pricing/}).click();
    await visible(listingRow().getByText('Offer: ₹8,42,000',{exact:true}));
    assert(await page.locator('main').evaluate(node=>node.scrollWidth <= node.clientWidth+1));
    await page.getByRole('link',{name:'Test Drives',exact:true}).click();
    const driveDate = new Date(Date.now()+3*86400000).toISOString().slice(0,10);
    await label('Availability date').fill(driveDate);
    await button('10:00 AM · Closed').click();
    await visible(button('10:00 AM · Open'));
    await button('11:00 AM · Closed').click();
    await visible(button('11:00 AM · Open'));
    await signout();
    console.log('Dealer registration, admin approval, listing form, pricing edit, dialog scrolling, Escape and 1000×700 resizing passed.');

    await login(buyerEmail);
    await page.getByRole('link',{name:'India Catalogue',exact:true}).click();
    await visible(page.getByRole('heading',{name:'Indian car catalogue'}));
    await visible(page.getByText(/\d+ models/).first());
    const catalogue = await good('india.operation','catalogue');
    assert(catalogue.length>=75);
    await label('Manufacturer').selectOption('Tata Motors');
    await label('Search').fill('Nexon');
    await page.getByRole('article').filter({has:page.getByRole('heading',{name:'Nexon',exact:true})}).getByRole('link',{name:'View model'}).click();
    await visible(page.getByRole('heading',{name:'Nexon',exact:true}));
    await label('State').selectOption('Andhra Pradesh');
    await label('City').selectOption('Visakhapatnam');
    await visible(page.getByText('Audit Motors',{exact:true}).first());
    await label('State').selectOption('Delhi');
    await visible(page.getByText('No dealer listings for this variant and location.'));
    await button('Add to favourites').click();
    await page.getByRole('link',{name:'My Garage',exact:true}).click();
    await visible(page.getByText(/Favourites \(1\)/));
    await button('Dark mode').click();
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await page.waitForFunction(()=>{
      const link=document.querySelector('aside nav a');
      if(!link) return false;
      const [red]=getComputedStyle(link).color.match(/\d+/g) || [];
      return Number(red)>170;
    });
    if(process.env.BESTBUY_AUDIT_SHOTS) await page.screenshot({path:join(process.env.BESTBUY_AUDIT_SHOTS,'bestbuy-dark.png')});
    await page.reload();
    await visible(button('Light mode'));
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await button('Light mode').click();
    await page.getByRole('link',{name:'Browse Cars',exact:true}).click();
    const queueRequest = {customerId:registered.id,vehicleModelId:listing.vehicleModelId,
      variantId:listing.variantId,city:listing.dealer.city,state:listing.dealer.state};
    await page.getByPlaceholder('Search by brand, model, variant, color, dealership, or city...').fill('Audit Blue');
    await button('Details').click();
    await button('Join Shared Queue').click();
    await button('Confirm & Join Queue').click();
    await visible(page.getByText(/Successfully joined waitlist queue/));
    await page.getByRole('link',{name:'Book Test Drive',exact:true}).click();
    await label('Date').fill(driveDate);
    await button('10:00 AM').click();
    await label('Indian mobile number').fill('9876543210');
    await button('Request test drive').click();
    await visible(page.getByRole('heading',{name:'Request submitted'}));
    const [request] = await good('india.operation','drives');
    assert.equal(request.status,'requested');
    assert.equal((await bridge('india.operation','request',{listingId:listing.id,date:driveDate,time:'10:00',name:'Audit Customer',mobile:'9876543210',email:buyerEmail,contact:'phone'})).success,false);
    await button('Reschedule').click();
    await button('11:00 AM').click();
    await button('Save new time').click();
    await visible(page.getByText(/11:00 AM IST/).first());
    assert.equal((await good('india.operation','drives'))[0].time,'11:00');
    const shared = await Promise.all([good('queue.join',queueRequest),good('queue.join',queueRequest)]);
    assert.equal(shared[0].id,shared[1].id);
    assert.equal((await good('queue.getByCustomerId',registered.id)).length,1);
    assert.equal((await good('queue.getPosition',shared[0].id)).position,shared[0].position);
    await good('queue.leave',shared[0].id);
    const rejoined = await good('queue.join',queueRequest);
    assert(rejoined.position > shared[0].position);
    await signout();
    await login(dealerEmail);
    await page.getByRole('link',{name:'Test Drives',exact:true}).click();
    await button('Accept request').click();
    await visible(page.getByText('Request confirmed.',{exact:true}));
    const offerInput = {queueEntryId:rejoined.id,customerId:registered.id,listingId:listing.id,offeredPrice:829000,
      expiryDate:new Date(Date.now()+86_400_000).toISOString()};
    const declined = await good('offers.create',offerInput);
    const accepted = await good('offers.create',{...offerInput,offeredPrice:825000});
    await signout();
    await login(buyerEmail);
    await page.getByRole('link',{name:'Test Drives',exact:true}).click();
    await visible(page.getByText(/confirmed · .* IST$/));
    await button('Cancel booking').click();
    await visible(page.getByText('Test drive cancelled.',{exact:true}));
    await page.getByRole('link',{name:'Dashboard',exact:true}).click();
    assert.equal((await bridge('admin.getAuditLog')).success,false);
    await page.getByTitle('Notifications').click();
    await visible(page.getByText('New dealer offer',{exact:true}).first());
    await button('Mark all read').click();
    assert((await good('notifications.getAll')).every(item=>item.isRead));
    await page.getByTitle('Notifications').click();
    await page.getByRole('button',{name:/Dealer Offers/}).click();
    await button('Decline').first().click();
    await button('Decline Offer',page.getByRole('dialog',{name:'Decline offer'})).click();
    await visible(page.getByText('Offer declined. Dealer has been notified.'));
    await button('Accept & Lock Price').click();
    await button('Confirm Price Lock & Book').click();
    await visible(page.getByText('Price Locked & Booking Created'));
    const decisions = await good('offers.getByCustomerId',registered.id);
    assert.equal(decisions.filter(item=>item.status==='accepted').length,1);
    assert.equal(decisions.filter(item=>item.status==='declined').length,1);
    assert(decisions.some(item=>item.id===declined.id) && decisions.some(item=>item.id===accepted.id));
    const [locked] = await good('bookings.getByCustomerId',registered.id);
    const acceptedOffer = decisions.find(item=>item.status==='accepted');
    assert.equal(locked.lockedPrice,acceptedOffer.offeredPrice);
    assert(Date.parse(locked.priceLockedUntil)>Date.now());
    assert.equal((await bridge('bookings.updateStatus',locked.id,'completed')).success,false);
    const direct = await good('bookings.create',{listingId:listing.id,dealerId:listing.dealerId,lockedPrice:842000});
    assert.equal(direct.lockedPrice,842000);
    await signout();
    await login(dealerEmail);
    await good('vehicles.updatePrice',listing.id,{dealerOfferPrice:850000});
    assert.equal((await good('bookings.getByDealerId',listing.dealerId)).find(row=>row.id===locked.id).lockedPrice,locked.lockedPrice);
    assert.equal((await bridge('bookings.updateStatus',direct.id,'completed')).success,false);
    await good('bookings.updateStatus',direct.id,'confirmed');
    await signout();
    await login('admin@bestbuy.example','demo1234');
    await page.getByRole('navigation',{name:'Administration'}).getByRole('link',{name:'Audit log',exact:true}).click();
    await visible(page.getByText('Booking accepted',{exact:true}).first());
    await good('admin.updateCustomerStatus',registered.id,'suspended',registered.id);
    await good('admin.updateCustomerStatus',registered.id,'active',registered.id);
    await page.getByRole('navigation',{name:'Administration'}).getByRole('link',{name:'Reports',exact:true}).click();
    await visible(page.getByRole('heading',{name:'Booking conversion',exact:true}));
    await page.getByRole('link',{name:'Catalogue Management',exact:true}).click();
    await label('Find model').fill('Tata Motors Nexon');
    await button('Edit model').first().click();
    await button('Save model').click();
    await visible(page.getByText('Catalogue model saved.'));
    await label('Manufacturer group').selectOption('BYD');
    await button('Deactivate all models').click();
    await visible(page.getByText('Manufacturer models deactivated.'));
    assert((await good('india.operation','catalogue')).filter(car=>car.manufacturer==='BYD').every(car=>!car.active));
    await button('Publish all models').click();
    await visible(page.getByText('Manufacturer models published.'));
    await page.getByRole('link',{name:'Settings',exact:true}).click();
    await label('Booking window in days').fill('45');
    await button('Save booking window').click();
    await visible(page.getByText('Booking window saved.'));
    assert.equal(await good('india.operation','settings'),45);
    assert.deepEqual(errors,[]);
    console.log('India catalogue, favourites, persisted themes, test-drive request, conflict, reschedule, dealer confirmation and cancellation passed.');
    console.log('Shared queue allocation, leave/rejoin, offers, bookings, price locks, notifications, admin audit, authorization and renderer console checks passed.');
  } finally {
    try { await app?.close(); } finally { await rm(profile,{recursive:true,force:true}); }
  }
}

main().catch(error=>{console.error(error);process.exitCode=1;});
