-- Starting WCoins raised from 50 to 200; grant the +150 difference to existing hunters.
update characters
set bronze = bronze + 150;
