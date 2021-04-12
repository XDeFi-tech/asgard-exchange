import { Component, OnDestroy, OnInit } from '@angular/core';
import { Balances } from '@xchainjs/xchain-client';
import { Subscription } from 'rxjs';
import { User } from '../_classes/user';
import { MidgardService } from '../_services/midgard.service';
import { UserService } from '../_services/user.service';
import { PoolDTO } from '../_classes/pool';
import { MemberPool } from '../_classes/member';
import { TransactionStatusService } from '../_services/transaction-status.service';
import { isNonNativeRuneToken } from '../_classes/asset';

@Component({
  selector: 'app-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit, OnDestroy {

  user: User;
  pools: PoolDTO[];
  userPoolError: boolean;
  subs: Subscription[];
  loading: boolean;
  balances: Balances;
  createablePools: string[];
  memberPools: MemberPool[];
  addresses: string[];

  constructor(private userService: UserService, private midgardService: MidgardService, private txStatusService: TransactionStatusService) {

    this.subs = [];

    const user$ = this.userService.user$.subscribe(
      (user) => {
        this.user = user;
        this.getAccountPools();
      }
    );

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        this.checkCreateableMarkets();
      }
    );

    const pendingTx$ = this.txStatusService.txs$.subscribe(
      (tx) => {

        if (tx) {
          // have to call this twice to break the midgard cache
          setTimeout( () => {
            this.getAccountPools();
          }, 3000);
        }

      }
    );

    this.subs.push(user$, balances$, pendingTx$);

  }

  ngOnInit(): void {
    this.getPools();
  }

  getPools() {
    this.midgardService.getPools().subscribe(
      (res) => {
        this.pools = res;
        this.checkCreateableMarkets();
      }
    );
  }

  checkCreateableMarkets() {

    if (this.pools && this.balances) {

      this.createablePools = this.balances.filter( (balance) => {
        const asset = balance.asset;
        return !this.pools.find((pool) => pool.asset === `${asset.chain}.${asset.symbol}`)
          && !isNonNativeRuneToken(asset);
      }).map( (balance) => `${balance.asset.chain}.${balance.asset.symbol}` );

    }

  }

  async getAddresses(): Promise<string[]> {
    const thorClient = this.user.clients.thorchain;
    const thorAddress = await thorClient.getAddress();

    const btcClient = this.user.clients.bitcoin;
    const btcAddress = await btcClient.getAddress();

    const ltcClient = this.user.clients.litecoin;
    const ltcAddress = await ltcClient.getAddress();

    const bchClient = this.user.clients.bitcoinCash;
    const bchAddress = await bchClient.getAddress();

    const bnbClient = this.user.clients.binance;
    const bnbAddress = await bnbClient.getAddress();

    const ethClient = this.user.clients.ethereum;
    const ethAddress = await ethClient.getAddress();

    return [thorAddress, btcAddress, ltcAddress, bchAddress, bnbAddress, ethAddress];
  }

  async getAccountPools() {
    this.loading = true;

    if (this.user) {

      if (!this.addresses) {
        this.addresses = await this.getAddresses();
      }

      for (const address of this.addresses) {
        this.midgardService.getMember(address).subscribe(
          (res) => {
            if (!this.memberPools) {
              this.memberPools = res.pools;
            } else {
              for (const pool of res.pools) {
                const match = this.memberPools.find( (existingPool) => existingPool.pool === pool.pool );
                if (!match) {
                  this.memberPools.push(pool);
                }
              }
            }
          }
        );
      }
    }

    this.loading = false;
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
