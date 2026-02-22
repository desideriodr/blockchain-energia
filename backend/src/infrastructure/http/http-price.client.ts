import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HttpPriceClient {
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await axios.get<T>(url, { params });
    return response.data;
  }
}
