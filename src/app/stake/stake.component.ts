import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { assetAmount, assetToBase, baseAmount, getValueOfAssetInRune, getValueOfRuneInAsset, PoolData } from '@thorchain/asgardex-util';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Asset } from '../_classes/asset';
import { AssetBalance } from '../_classes/asset-balance';
import { MidgardService } from '../_services/midgard.service';
import { UserService } from '../_services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmStakeModalComponent } from './confirm-stake-modal/confirm-stake-modal.component';
import { User } from '../_classes/user';

@Component({
  selector: 'app-stake',
  templateUrl: './stake.component.html',
  styleUrls: ['./stake.component.scss']
})
export class StakeComponent implements OnInit, OnDestroy {

  runeSymbol = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';

  /**
   * Rune
   */
  rune: Asset;

  get runeAmount() {
    return this._runeAmount;
  }
  set runeAmount(val: number) {
    this._runeAmount = val;
  }
  _runeAmount: number;

  /**
   * Asset
   */
  set asset(val: Asset) {

    if (val) {

      if (!this._asset) {
        this._asset = val;
      } else {

        if (val.symbol !== this._asset.symbol) {
          this.router.navigate(['/', 'stake', val.symbol]);
          this._asset = val;
          this.assetBalance = this.userService.findBalance(this.balances, this.asset);
        }

      }

    }

  }
  get asset() {
    return this._asset;
  }
  _asset: Asset;
  get assetAmount() {
    return this._assetAmount;
  }
  set assetAmount(val: number) {

    this._assetAmount = val;

    if (val) {
      this.updateRuneAmount();
    } else {
      this.runeAmount = null;
    }

  }
  private _assetAmount: number;
  assetPoolData: PoolData;

  /**
   * Balances
   */
  balances: AssetBalance[];
  runeBalance: number;
  assetBalance: number;

  user: User;
  subs: Subscription[];

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private midgardService: MidgardService
  ) {
    this.rune = new Asset(this.runeSymbol);

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        this.runeBalance = this.userService.findBalance(this.balances, this.rune);
        this.assetBalance = this.userService.findBalance(this.balances, this.asset);
      }
    );

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    this.subs = [balances$, user$];

  }

  ngOnInit(): void {

    const params$ = this.route.paramMap.subscribe( (params) => {

      const asset = params.get('asset');

      if (asset) {
        this.asset = new Asset(asset);
        this.getPoolDetail(asset);
        this.assetBalance = this.userService.findBalance(this.balances, this.asset);

      }

    });

    this.subs.push(params$);

  }

  updateRuneAmount() {

    const runeAmount = getValueOfAssetInRune(assetToBase(assetAmount(this.assetAmount)), this.assetPoolData);

    this.runeAmount = runeAmount.amount().div(10 ** 8 ).toNumber();

  }

  getPoolDetail(asset: string) {
    this.midgardService.getPoolDetails([asset]).subscribe(
      (res) => {

        if (res && res.length > 0) {

          this.assetPoolData = {
            assetBalance: baseAmount(res[0].assetDepth),
            runeBalance: baseAmount(res[0].runeDepth),
          };

        }
      },
      (err) => console.error('error getting pool detail: ', err)
    );
  }

  openConfirmationDialog() {

    const runeBasePrice = getValueOfAssetInRune(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();
    const assetBasePrice = getValueOfRuneInAsset(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();

    const dialogRef = this.dialog.open(
      ConfirmStakeModalComponent,
      {
        width: '50vw',
        maxWidth: '420px',
        minWidth: '260px',
        data: {
          asset: this.asset,
          rune: this.rune,
          assetAmount: this.assetAmount,
          runeAmount: this.runeAmount,
          user: this.user,
          runeBasePrice,
          assetBasePrice
        }
      }
    );

    dialogRef.afterClosed().subscribe( (transactionSuccess: boolean) => {

      if (transactionSuccess) {
        this.assetAmount = 0;
      }

    });
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}