import axios from 'axios';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

export interface ExecuteCodeRequest {
  language: string;
  version: string;
  files: { name?: string; content: string }[];
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

export interface ExecuteCodeResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
}

export const pistonApi = {
  async getRuntimes() {
    const response = await axios.get(`${PISTON_API_URL}/runtimes`);
    return response.data;
  },

  async executeCode(data: ExecuteCodeRequest): Promise<ExecuteCodeResponse> {
    const response = await axios.post(`${PISTON_API_URL}/execute`, data);
    return response.data;
  }
};
