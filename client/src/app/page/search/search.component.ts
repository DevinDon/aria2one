import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError, switchMap, tap, timeout } from 'rxjs/operators';
import { AppService } from 'src/app/service/app.service';
import { Aria2Service } from 'src/app/service/aria2.service';
import { CrawlerService } from 'src/app/service/crawler.service';
import { Device } from 'src/app/util/device';

interface Download {
  title: string;
  url: string;
  size: string;
}

interface Movie {
  title: string;
  url: string;
  image?: string;
  desc?: string;
  type?: string;
  download?: Download[];
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  device: Device;
  keyword = '';
  movies: Movie[] = [];

  constructor(
    private app: AppService,
    private aria2: Aria2Service,
    private crawler: CrawlerService
  ) { }

  ngOnInit() {
    this.app.observableDevice()
      .subscribe(device => this.device = device);
  }

  search(keyword: string) {
    if (!keyword) { return; }
    this.keyword = keyword;
    this.movies = undefined;
    this.crawler.search(keyword)
      .pipe(
        timeout(5000),
        catchError(e => {
          this.app.openBar('请求超时，请重试。');
          this.movies = [];
          return of([]);
        }),
        tap(x => this.movies = x),
        switchMap(e => this.crawler.searchDetail(keyword).pipe(timeout(30000)))
      )
      .subscribe(movies => this.movies = movies);
  }

  download(download: Download[]) {
    console.log(download);
    return;
    if (!download) { return; }
    this.aria2.addTask(download[0].url)
      .pipe(
        catchError(e => {
          this.app.openBar('任务添加失败，请重试');
          throw e;
        })
      )
      .subscribe(gid => this.app.openBar('任务添加成功：' + gid));
  }

  trackByMovieTitle(index: number, movie: Movie): string {
    return movie.title;
  }

}
